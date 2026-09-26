def normalize_formation(formation):
    """
    Normalize formation names for comparison.
    """

    if formation is None:
        return ""

    formation = str(formation).strip().lower()

    formation = " ".join(
        formation.split()
    )

    return formation


def compare_formations(
    target_formation,
    nearby_formation
):
    """
    Compare the geological formation of the
    target well and nearby well.
    """

    target = normalize_formation(
        target_formation
    )

    nearby = normalize_formation(
        nearby_formation
    )

    if not target or not nearby:

        return {
            "target_formation": target_formation,
            "nearby_formation": nearby_formation,
            "match": False
        }

    return {
        "target_formation": target_formation,
        "nearby_formation": nearby_formation,
        "match": target == nearby
    }