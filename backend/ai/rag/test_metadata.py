from backend.ai.rag.ingestion.metadata_extractor import extract_metadata


text = """
Daily Drilling Report — Well W104

Total Depth: 2850 m

Primary Formation: Barail Formation

At 2410 m MD, partial mud loss was observed
at an estimated 4–6 m³/hr.

At 2465 m MD, torque increased from
9 kN·m to 14 kN·m.

A short wiper trip was performed from
2470 m to 2380 m MD.
"""


metadata = extract_metadata(
    text,
    "W104_DDR.pdf"
)


print("\nExtracted Metadata")
print("=" * 40)

print("Well ID:", metadata["well_id"])
print("Depths:", metadata["depths"])
print("Formation:", metadata["formation"])
print("Events:", metadata["events"])