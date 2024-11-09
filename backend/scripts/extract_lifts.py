import osmium
import shapely.wkb as wkblib
import geopandas as gpd
import matplotlib.pyplot as plt
import requests
import json
from shapely.geometry import LineString
import numpy as np
from io import BytesIO
import tempfile
import os
import sys
from pathlib import Path


class WayHandler(osmium.SimpleHandler):
    def __init__(self):
        super(WayHandler, self).__init__()
        self.lifts = []
        self.nodes = {}  # Cache for node coordinates

    def node(self, n):
        # Cache node coordinates
        self.nodes[n.id] = {"lat": n.location.lat, "lon": n.location.lon}

    def way(self, w):
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


def get_elevation_data(bounds):
    """Fetch elevation data from Open-Elevation API"""
    url = "https://api.open-elevation.com/api/v1/lookup"
    points = []

    # Create a grid of points
    lat_range = np.linspace(bounds[1], bounds[3], 20)
    lon_range = np.linspace(bounds[0], bounds[2], 20)

    for lat in lat_range:
        for lon in lon_range:
            points.append({"latitude": lat, "longitude": lon})

    response = requests.post(url, json={"locations": points})
    results = response.json()["results"]

    # Reshape the elevation data
    elevations = np.array([r["elevation"] for r in results]).reshape(20, 20)
    return elevations


def extract_ski_lifts(area_name):
    """Extract ski lifts for a given area and create a clean map"""
    # First, get the area boundary from Nominatim
    nominatim_url = (
        f"https://nominatim.openstreetmap.org/search?q={area_name}&format=json"
    )
    headers = {"User-Agent": "SkiLiftMapper/1.0 (your@email.com)"}
    response = requests.get(nominatim_url, headers=headers)

    # Add debugging and error handling
    print(f"Nominatim Status Code: {response.status_code}")
    print(f"Response content: {response.text}")

    if response.status_code != 200:
        raise Exception(f"Nominatim API returned status code {response.status_code}")

    results = response.json()
    if not results:
        raise Exception(f"No results found for area: {area_name}")

    location_data = results[0]

    # Define the bounding box
    bbox = f"{float(location_data['boundingbox'][2])},{float(location_data['boundingbox'][0])},{float(location_data['boundingbox'][3])},{float(location_data['boundingbox'][1])}"

    # Download OSM data
    api = f"https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:25];
    // Get all aerialways in and around the area
    (
        way["aerialway"](around:5000,{location_data['lat']},{location_data['lon']});
        >;  // Get all nodes
    );
    out body;
    """

    # Add debug print for query
    print(f"Overpass Query: {query}")

    response = requests.get(api, params={"data": query})

    # Add more detailed debugging
    print(f"Number of elements returned: {len(response.json().get('elements', []))}")
    print(
        f"Types of elements: {[e.get('type') for e in response.json().get('elements', [])][:10]}"
    )  # First 10 elements

    # Add debug print for raw response
    print(f"Raw Response: {response.text[:500]}...")  # First 500 chars

    # Add error handling and debugging for Overpass API
    print(f"Overpass API Status Code: {response.status_code}")
    print(
        f"Overpass API Response Content Type: {response.headers.get('content-type', 'unknown')}"
    )

    if response.status_code != 200:
        raise Exception(f"Overpass API returned status code {response.status_code}")

    if "text/html" in response.headers.get("content-type", ""):
        raise Exception(
            "Overpass API returned HTML instead of OSM data. The API might be overloaded."
        )

    # Convert JSON response to OSM format
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

    # Create a temporary file to store the OSM data
    with tempfile.NamedTemporaryFile(delete=False, suffix=".osm") as tmp_file:
        tmp_file.write(osm_data.encode("utf-8"))
        tmp_file_path = tmp_file.name

    try:
        # Parse the lifts using the temporary file
        handler = WayHandler()
        handler.apply_file(tmp_file_path)
    finally:
        # Clean up the temporary file
        os.unlink(tmp_file_path)

    # Add debug print before GeoDataFrame creation
    print("Number of lifts found:", len(handler.lifts))
    if handler.lifts:
        print("Sample lift data:", handler.lifts[0])

    # Create GeoDataFrame with error handling
    if not handler.lifts:
        raise Exception("No lift data found for this area")

    try:
        gdf = gpd.GeoDataFrame(
            handler.lifts
        )  # Remove geometry parameter since it's already in the data
    except Exception as e:
        print("Error creating GeoDataFrame:", e)
        print("Lift data structure:", handler.lifts)
        raise

    gdf.set_crs(epsg=4326, inplace=True)  # Set coordinate reference system to WGS84

    # Get elevation data
    bounds = [float(x) for x in bbox.split(",")]
    elevations = get_elevation_data(bounds)

    # Create the map
    fig, ax = plt.subplots(figsize=(15, 15))

    # Define image dimensions
    IMG_WIDTH = 1500  # pixels
    IMG_HEIGHT = 1500  # pixels

    # Get the bounds of all geometries
    total_bounds = gdf.total_bounds  # Returns (minx, miny, maxx, maxy)

    def transform_coords(x, y):
        """Transform geographic coordinates to image coordinates"""
        # Normalize coordinates to 0-1 range
        x_norm = (x - total_bounds[0]) / (total_bounds[2] - total_bounds[0])
        y_norm = (y - total_bounds[1]) / (total_bounds[3] - total_bounds[1])

        # Scale to image size and flip y-axis (image coordinates start from top)
        x_img = x_norm * IMG_WIDTH
        y_img = (1 - y_norm) * IMG_HEIGHT

        return x_img, y_img

    # Plot contour lines with transformed coordinates
    x = np.linspace(bounds[0], bounds[2], 20)
    y = np.linspace(bounds[1], bounds[3], 20)
    X, Y = np.meshgrid(x, y)
    X_img = np.zeros_like(X)
    Y_img = np.zeros_like(Y)

    for i in range(X.shape[0]):
        for j in range(X.shape[1]):
            X_img[i, j], Y_img[i, j] = transform_coords(X[i, j], Y[i, j])

    plt.contour(X_img, Y_img, elevations, colors="gray", alpha=0.5)

    # Transform lift coordinates and plot
    for idx, row in gdf.iterrows():
        coords = list(row.geometry.coords)
        img_coords = [transform_coords(x, y) for x, y in coords]
        x_coords, y_coords = zip(*img_coords)
        plt.plot(x_coords, y_coords, color="red", linewidth=2)

    # Set the plot limits to match image dimensions
    ax.set_xlim(0, IMG_WIDTH)
    ax.set_ylim(IMG_HEIGHT, 0)  # Flip y-axis

    # Clean up the map
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_frame_on(False)

    # Save the map
    plt.savefig("ski_map.png", dpi=300, bbox_inches="tight")

    # When converting to database format, store the transformed coordinates
    lifts_data = []
    for idx, row in gdf.iterrows():
        coords = list(row.geometry.coords)
        img_coords = [transform_coords(x, y) for x, y in coords]

        lift_data = {
            "name": row["name"],
            "capacity": row["capacity"],
            "current_load": row["capacity"] // 2,  # Estimate
            "description": row["description"],
            "image_url": "",  # Would need additional source
            "webcam_url": "",  # Would need additional source
            "status": row["status"],
            "type": row["type"],
            "difficulty": row["difficulty"],
            "path": json.dumps(
                [[x, y] for x, y in img_coords]
            ),  # Store image coordinates
            "wait_time": 5,  # Default wait time
        }
        lifts_data.append(lift_data)

    return lifts_data


if __name__ == "__main__":
    # Add parent directory to Python path
    sys.path.append(str(Path(__file__).parent.parent))

    # Example usage
    lifts = extract_ski_lifts("Zauchensee")

    # Import after adding to path
    from app.database import engine, SessionLocal
    from app.models import Base, SkiLift

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    for lift_data in lifts:
        lift = SkiLift(**lift_data)
        db.add(lift)

    db.commit()
    db.close()
