import osmium
import geopandas as gpd
import matplotlib.pyplot as plt
import requests
import json
from shapely.geometry import LineString
import numpy as np
import tempfile
import os
import sys
from pathlib import Path
import random
from shapely.geometry import Polygon

# Image dimensions
IMG_WIDTH = 1600
IMG_HEIGHT = 1200


class WayHandler(osmium.SimpleHandler):
    def __init__(self):
        super(WayHandler, self).__init__()
        self.lifts = []
        self.pistes = []
        self.water_bodies = []
        self.nodes = {}
        self.way_nodes = {}  # Add storage for way nodes

    def node(self, n):
        # Cache node coordinates
        self.nodes[n.id] = {"lat": n.location.lat, "lon": n.location.lon}

    def way(self, w):
        # Store way nodes first
        self.way_nodes[w.id] = [node.ref for node in w.nodes]

        if "aerialway" in w.tags:
            print(
                f"Found aerialway: {w.tags.get('name', 'Unnamed')} - Type: {w.tags.get('aerialway')}"
            )
            try:
                # Create linestring from node coordinates
                coords = []
                for node_ref in w.nodes:
                    node = self.nodes.get(node_ref.ref)
                    if node:
                        coords.append((node["lon"], node["lat"]))
                    else:
                        print(f"Warning: Missing node {node_ref.ref}")

                if len(coords) < 2:
                    print(
                        f"Warning: Not enough coordinates for lift {w.tags.get('name', 'Unnamed')}"
                    )
                    return

                line = LineString(coords)

                lift_data = {
                    "name": w.tags.get("name", "Unnamed Lift"),
                    "type": w.tags.get("aerialway", "unknown"),
                    "difficulty": w.tags.get("piste:difficulty", "intermediate"),
                    "status": "open",
                    "geometry": line,
                    "capacity": int(w.tags.get("aerialway:capacity", "1800")),
                    "description": w.tags.get("description", ""),
                }
                self.lifts.append(lift_data)
                print(f"Successfully added lift: {lift_data['name']}")
            except Exception as e:
                print(f"Error processing lift: {str(e)}")
                print(f"Node refs: {[node.ref for node in w.nodes]}")

        # Add piste handling
        if "piste:type" in w.tags:
            try:
                coords = []
                for node_ref in w.nodes:
                    node = self.nodes.get(node_ref.ref)
                    if node:
                        coords.append((node["lon"], node["lat"]))
                    else:
                        print(f"Warning: Missing node {node_ref.ref}")

                if len(coords) < 2:
                    print(
                        f"Warning: Not enough coordinates for piste {w.tags.get('name', 'Unnamed')}"
                    )
                    return

                line = LineString(coords)

                piste_data = {
                    "name": w.tags.get("name", "Unnamed Piste"),
                    "type": w.tags.get("piste:type", "downhill"),
                    "difficulty": w.tags.get("piste:difficulty", "intermediate"),
                    "geometry": line,
                }
                self.pistes.append(piste_data)
                print(f"Successfully added piste: {piste_data['name']}")
            except Exception as e:
                print(f"Error processing piste: {str(e)}")

        # Updated water body handling
        if "natural" in w.tags and w.tags["natural"] == "water" or "water" in w.tags:
            try:
                coords = []
                node_refs = self.way_nodes[w.id]

                # Get coordinates for each node
                for node_ref in node_refs:
                    node = self.nodes.get(node_ref)
                    if node:
                        coords.append((node["lon"], node["lat"]))

                if len(coords) < 3:  # Need at least 3 points for a polygon
                    print(
                        f"Warning: Not enough coordinates for water body {w.tags.get('name', 'Unnamed')}"
                    )
                    return

                # Ensure the polygon is closed
                if coords[0] != coords[-1]:
                    coords.append(coords[0])

                try:
                    # Create polygon and validate it
                    polygon = Polygon(coords)
                    if not polygon.is_valid:
                        print(
                            f"Warning: Invalid polygon for water body {w.tags.get('name', 'Unnamed')}"
                        )
                        return

                    water_data = {
                        "name": w.tags.get("name", "Unnamed Water Body"),
                        "type": w.tags.get(
                            "natural",
                            w.tags.get("water", w.tags.get("waterway", "unknown")),
                        ),
                        "geometry": polygon,
                    }
                    self.water_bodies.append(water_data)
                    print(f"Successfully added water body: {water_data['name']}")
                except Exception as e:
                    print(f"Error creating polygon: {str(e)}")

            except Exception as e:
                print(f"Error processing water body: {str(e)}")


def get_elevation_data(bounds):
    """Fetch elevation data from Open-Elevation API"""
    GRID_SIZE = 100  # Changed from 50 to match the coordinate grid

    url = "https://api.open-elevation.com/api/v1/lookup"
    points = []

    # Create a denser grid of points
    lat_range = np.linspace(bounds[1], bounds[3], GRID_SIZE)
    lon_range = np.linspace(bounds[0], bounds[2], GRID_SIZE)

    for lat in lat_range:
        for lon in lon_range:
            points.append({"latitude": lat, "longitude": lon})

    try:
        response = requests.post(url, json={"locations": points})
        if response.status_code != 200:
            print(
                f"Error: Failed to get elevation data (Status: {response.status_code})"
            )
            return np.zeros((GRID_SIZE, GRID_SIZE))

        results = response.json()
        if "results" not in results:
            print("Error: Unexpected API response format")
            return np.zeros((GRID_SIZE, GRID_SIZE))

        elevations = np.array([r["elevation"] for r in results["results"]]).reshape(
            GRID_SIZE, GRID_SIZE
        )

        # Apply smoothing to reduce noise
        from scipy.ndimage import gaussian_filter

        elevations = gaussian_filter(elevations, sigma=1)

        return elevations

    except Exception as e:
        print(f"Error fetching elevation data: {str(e)}")
        return np.zeros((GRID_SIZE, GRID_SIZE))


def transform_coords(lon, lat, bounds, img_width, img_height):
    """Transform geographic coordinates to pixel coordinates"""
    x = (lon - bounds[0]) / (bounds[2] - bounds[0]) * img_width
    y = img_height - (
        (lat - bounds[1]) / (bounds[3] - bounds[1]) * img_height
    )  # Flip Y-axis
    return x, y


def plot_contours(ax, X, Y, elevations, bounds):
    """Plot elevation contours with transformed coordinates"""
    # Transform the coordinate grids to pixel space
    X_pixels = (X - bounds[0]) / (bounds[2] - bounds[0]) * IMG_WIDTH
    Y_pixels = IMG_HEIGHT - ((Y - bounds[1]) / (bounds[3] - bounds[1]) * IMG_HEIGHT)

    # Calculate the elevation range
    elev_min = np.min(elevations)
    elev_max = np.max(elevations)

    interval = 20
    levels = np.arange(
        np.floor(elev_min / interval) * interval,
        np.ceil(elev_max / interval) * interval,
        interval,
    )

    major_levels = np.arange(
        np.floor(elev_min / 100) * 100, np.ceil(elev_max / 100) * 100, 100
    )

    # Plot contours in pixel space
    ax.contour(
        X_pixels,
        Y_pixels,
        elevations,
        levels=major_levels,
        colors="darkgray",
        alpha=0.7,
        linewidths=1.0,
    )
    ax.contour(
        X_pixels,
        Y_pixels,
        elevations,
        levels=levels,
        colors="gray",
        alpha=0.3,
        linewidths=0.5,
    )

    # Set the axis limits to match image dimensions
    ax.set_xlim(0, IMG_WIDTH)
    ax.set_ylim(IMG_HEIGHT, 0)  # Flip Y-axis
    ax.set_axis_off()


def extract_ski_lifts(area_name):
    """Extract ski lifts for a given area and create a clean map"""
    # First, get the area boundary from Nominatim
    nominatim_url = (
        f"https://nominatim.openstreetmap.org/search?q={area_name}&format=json"
    )
    headers = {"User-Agent": "SkiLiftMapper/1.0 (your@email.com)"}
    response = requests.get(nominatim_url, headers=headers)

    # Debugging
    print(f"Nominatim Status Code: {response.status_code}")
    print(f"Response content: {response.text}")

    if response.status_code != 200:
        raise Exception(f"Nominatim API returned status code {response.status_code}")

    results = response.json()
    if not results:
        raise Exception(f"No results found for area: {area_name}")

    location_data = results[0]

    bbox = [
        float(location_data["boundingbox"][2]),  # min_lon
        float(location_data["boundingbox"][0]),  # min_lat
        float(location_data["boundingbox"][3]),  # max_lon
        float(location_data["boundingbox"][1]),  # max_lat
    ]

    padding = 0.2  # Changed from 0.2 to 1.0 for 100% padding
    lon_range = bbox[2] - bbox[0]
    lat_range = bbox[3] - bbox[1]

    bounds = [
        bbox[0] - (lon_range * padding),  # min_lon
        bbox[1] - (lat_range * padding),  # min_lat
        bbox[2] + (lon_range * padding),  # max_lon
        bbox[3] + (lat_range * padding),  # max_lat
    ]

    # Update the query to explicitly fetch all nodes for ways
    query = f"""
    [out:json][timeout:60];
    area[name="{area_name}"]->.searchArea;
    (
        way["aerialway"](area.searchArea);
        way["piste:type"](area.searchArea);
        way["natural"="water"](area.searchArea);
        way["water"](area.searchArea);
    );
    (._;>;);  // This fetches all nodes for the ways
    out body;
    """

    # Increase timeout and add error handling
    api = "https://overpass-api.de/api/interpreter"
    try:
        response = requests.post(api, data={"data": query}, timeout=60)
    except requests.exceptions.Timeout:
        print("Trying alternative Overpass API endpoint...")
        api = "https://overpass.kumi.systems/api/interpreter"
        response = requests.post(api, data={"data": query}, timeout=60)

    print(f"Number of elements returned: {len(response.json().get('elements', []))}")
    print(f"Raw Response: {response.text[:500]}...")

    if response.status_code != 200:
        raise Exception(f"Overpass API returned status code {response.status_code}")

    if "text/html" in response.headers.get("content-type", ""):
        raise Exception(
            "Overpass API returned HTML instead of OSM data. The API might be overloaded."
        )

    osm_data = '<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6">\n'
    for element in response.json().get("elements", []):
        if element.get("type") == "way":
            osm_data += f'  <way id="{element["id"]}">\n'
            for tag in element.get("tags", {}).items():
                osm_data += f'    <tag k="{tag[0]}" v="{tag[1]}"/>\n'
            for node in element.get("nodes", []):
                osm_data += f'    <nd ref="{node}"/>\n'
            osm_data += "  </way>\n"
        elif element.get("type") == "node":
            osm_data += f'  <node id="{element["id"]}" lat="{element["lat"]}" lon="{element["lon"]}"/>\n'
    osm_data += "</osm>"

    with tempfile.NamedTemporaryFile(delete=False, suffix=".osm") as tmp_file:
        tmp_file.write(osm_data.encode("utf-8"))
        tmp_file_path = tmp_file.name

    try:
        handler = WayHandler()
        handler.apply_file(tmp_file_path)
    finally:
        os.unlink(tmp_file_path)

    print("Number of lifts found:", len(handler.lifts))
    if handler.lifts:
        print("Sample lift data:", handler.lifts[0])

    if not handler.lifts:
        raise Exception("No lift data found for this area")

    try:
        gdf = gpd.GeoDataFrame(handler.lifts)
    except Exception as e:
        print("Error creating GeoDataFrame:", e)
        print("Lift data structure:", handler.lifts)
        raise

    gdf.set_crs(epsg=4326, inplace=True)  # Set coordinate reference system to WGS84

    elevations = get_elevation_data(bounds)

    fig, ax = plt.subplots(figsize=(IMG_WIDTH / 100, IMG_HEIGHT / 100))

    # Remove margins/padding
    plt.subplots_adjust(left=0, right=1, top=1, bottom=0)

    x = np.linspace(bounds[0], bounds[2], elevations.shape[1])
    y = np.linspace(bounds[1], bounds[3], elevations.shape[0])
    X, Y = np.meshgrid(x, y)

    plot_contours(ax, X, Y, elevations, bounds)

    # Updated water body plotting
    for water in handler.water_bodies:
        try:
            if not water["geometry"].is_valid:
                print(f"Skipping invalid water body: {water['name']}")
                continue

            # Extract exterior coordinates of the polygon
            exterior_coords = list(water["geometry"].exterior.coords)
            pixel_coords = [
                transform_coords(lon, lat, bounds, IMG_WIDTH, IMG_HEIGHT)
                for lon, lat in exterior_coords
            ]

            if len(pixel_coords) < 3:
                continue

            x_pixels, y_pixels = zip(*pixel_coords)

            # Create a polygon patch
            polygon_patch = plt.Polygon(
                list(zip(x_pixels, y_pixels)),
                facecolor="lightblue",
                edgecolor="lightblue",
                alpha=0.3,
                linewidth=1,
            )
            ax.add_patch(polygon_patch)

            # Handle interior rings (holes)
            for interior in water["geometry"].interiors:
                interior_coords = list(interior.coords)
                interior_pixels = [
                    transform_coords(lon, lat, bounds, IMG_WIDTH, IMG_HEIGHT)
                    for lon, lat in interior_coords
                ]
                if len(interior_pixels) < 3:
                    continue

                ix_pixels, iy_pixels = zip(*interior_pixels)
                hole_patch = plt.Polygon(
                    list(zip(ix_pixels, iy_pixels)),
                    facecolor="white",
                    edgecolor="lightblue",
                    alpha=1.0,
                    linewidth=1,
                )
                ax.add_patch(hole_patch)

        except Exception as e:
            print(f"Error plotting water body {water.get('name', 'unnamed')}: {str(e)}")
            continue

    # Plot pistes first (so they appear under the lifts)
    for piste in handler.pistes:
        coords = list(piste["geometry"].coords)
        pixel_coords = [
            transform_coords(lon, lat, bounds, IMG_WIDTH, IMG_HEIGHT)
            for lon, lat in coords
        ]
        x_pixels, y_pixels = zip(*pixel_coords)

        # Color based on difficulty
        color_map = {
            "novice": "green",
            "easy": "blue",
            "intermediate": "red",
            "advanced": "black",
            "expert": "black",
        }
        color = color_map.get(piste["difficulty"], "blue")

        ax.plot(x_pixels, y_pixels, color=color, linewidth=1, alpha=0.7)

    # Plot lifts
    for idx, row in gdf.iterrows():
        coords = list(row.geometry.coords)
        pixel_coords = [
            transform_coords(lon, lat, bounds, IMG_WIDTH, IMG_HEIGHT)
            for lon, lat in coords
        ]
        x_pixels, y_pixels = zip(*pixel_coords)
        ax.plot(x_pixels, y_pixels, color="darkred", linewidth=2)

    plt.savefig(
        "data/ski_map.png",
        dpi=200,
        bbox_inches="tight",
        pad_inches=0,
        format="png",
        transparent=True,
    )

    return handler.lifts, bounds


def save_map_for_resort(plt, resort_id):
    """Save the map for a specific resort with proper sizing and zoom"""
    # Create the data directory if it doesn't exist
    os.makedirs("data", exist_ok=True)
    map_filename = f"ski_map_{resort_id}.png"
    map_path = os.path.join("data", map_filename)

    # Calculate DPI to maintain exact pixel dimensions
    fig_width_inches = IMG_WIDTH / 100
    fig_height_inches = IMG_HEIGHT / 100
    dpi = 100

    plt.gcf().set_size_inches(fig_width_inches, fig_height_inches)
    plt.savefig(
        map_path,
        dpi=dpi,
        bbox_inches="tight",
        pad_inches=0,
        format="png",
        transparent=True,
    )
    plt.close()
    return map_filename


if __name__ == "__main__":
    # Add parent directory to Python path
    sys.path.append(str(Path(__file__).parent.parent))

    from app.database import engine, SessionLocal
    from app.models import Base, SkiLift, SkiResort

    # Load ski resorts from JSON file
    with open(Path(__file__).parent.parent / "data" / "ski_resorts.json") as f:
        SKI_RESORTS = json.load(f)["resorts"]

    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Process each resort
    for resort_info in SKI_RESORTS:
        print(f"\nProcessing resort: {resort_info['name']}")
        try:
            # Get the lift data and bounds
            lifts, bounds = extract_ski_lifts(resort_info["name"])

            db = SessionLocal()
            try:
                # Create the ski resort
                ski_resort = SkiResort(
                    name=resort_info["name"],
                    location=resort_info["location"],
                    description=resort_info["description"],
                    image_url="",  # Will update after getting resort_id
                    website_url=resort_info["website"],
                    status="open",
                    snow_depth=random.randint(10, 100),
                    weather_conditions=random.choice(["sunny", "cloudy", "rainy"]),
                    total_lifts=len(lifts),
                    open_lifts=sum(1 for lift in lifts if lift.get("status") == "open"),
                )

                db.add(ski_resort)
                db.flush()  # Get the resort_id

                # Save the map with resort_id and update the image_url
                map_filename = save_map_for_resort(plt, ski_resort.id)
                ski_resort.image_url = f"/maps/{map_filename}"

                print(f"Adding {len(lifts)} new lift records...")
                for lift_data in lifts:
                    # Convert geometry to pixel coordinates
                    coords = list(lift_data["geometry"].coords)
                    pixel_coords = [
                        transform_coords(lon, lat, bounds, IMG_WIDTH, IMG_HEIGHT)
                        for lon, lat in coords
                    ]

                    # Create lift entry
                    lift = SkiLift(
                        resort_id=ski_resort.id,
                        name=lift_data["name"],
                        capacity=lift_data["capacity"],
                        current_load=0,
                        description=lift_data["description"],
                        image_url="",
                        webcam_url="",
                        status=random.choice(["open", "closed"]),
                        type=lift_data["type"],
                        difficulty=lift_data["difficulty"],
                        path=json.dumps(pixel_coords),
                        wait_time=random.randint(0, 10),
                    )
                    db.add(lift)

                db.commit()
                print(
                    f"New resort (ID: {ski_resort.id}) and lift data committed successfully"
                )
                print(f"Map saved as: {map_filename}")
            except Exception as e:
                print(f"Error during database operations: {e}")
                db.rollback()
            finally:
                db.close()
        except Exception as e:
            print(f"Error processing resort: {resort_info['name']}: {str(e)}")
