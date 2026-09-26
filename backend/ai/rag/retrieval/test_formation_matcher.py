from backend.ai.rag.retrieval.formation_matcher import (
    compare_formations
)


def main():

    print("=" * 60)
    print("FORMATION MATCHING TEST")
    print("=" * 60)

    result = compare_formations(
        target_formation="Barail Formation",
        nearby_formation="Barail Formation"
    )

    print("\nTarget Formation:")
    print(result["target_formation"])

    print("\nNearby Formation:")
    print(result["nearby_formation"])

    print("\nFormation Match:")
    print(result["match"])


if __name__ == "__main__":
    main()