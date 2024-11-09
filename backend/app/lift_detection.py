from skimage import io, feature, color, transform
import matplotlib.pyplot as plt


def detect_ski_lifts(image_path):
    print("Loading image...")
    # Read the image
    image = io.imread(image_path)
    print(f"Image loaded, shape: {image.shape}")

    # Convert RGBA to RGB by removing alpha channel
    if image.shape[-1] == 4:
        print("Converting RGBA to RGB...")
        image = image[..., :3]
        print(f"New image shape: {image.shape}")

    # Convert to grayscale
    gray = color.rgb2gray(image)
    print("Converted to grayscale")

    # Edge detection
    print("Detecting edges...")
    edges = feature.canny(gray, sigma=2, low_threshold=0.1, high_threshold=0.3)
    print("Edge detection complete")

    # Detect straight lines using probabilistic Hough transform
    print("Detecting lines...")
    lines = transform.probabilistic_hough_line(
        edges,
        threshold=10,  # Minimum number of intersections to detect a line
        line_length=100,  # Minimum length of line
        line_gap=5,  # Maximum gap between segments
    )
    print(f"Found {len(lines)} lines")

    # Show results
    print("Preparing visualization...")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))

    # Original image
    ax1.imshow(image)
    ax1.set_title("Original")
    ax1.axis("off")

    # Image with detected lines
    ax2.imshow(image)
    for line in lines:
        p0, p1 = line
        ax2.plot((p0[0], p1[0]), (p0[1], p1[1]), "-r", linewidth=2)
    ax2.set_title(f"Detected Lines ({len(lines)})")
    ax2.axis("off")

    print("Showing plot...")
    plt.tight_layout()
    plt.show()
    print("Done!")


if __name__ == "__main__":
    image_path = "data/image.png"
    detect_ski_lifts(image_path)
