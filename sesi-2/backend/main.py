from services.trip_service import calculate_daily_budget, get_travel_season, get_trip_category, get_transportation_recommendation, get_destination_recommendation

def print_destination(destinations):
    print("Your Destination")
    i = 0
    while i < len(destinations):
        print(f"{i + 1}. {destinations[i]}")
        i += 1

def print_recommended_place(destinations):
    print("Recommended Places")

    for destination in destinations:
        print(destination)

        for place in get_destination_recommendation(destination):
            print(f" - {place}")

def print_trip_summary(destinations, days, budget, month):
    daily = calculate_daily_budget(budget,days)
    category = get_trip_category(budget)
    transport = get_transportation_recommendation(category)
    season = get_travel_season(month)

    print("====================")
    print("KelanaAI")
    print("====================")
    print("")
    print(f"Destination         = {destinations}")
    print(f"Days                = {days}")
    print(f"Budget              = {budget} USD")
    print(f"Category            = {category}")
    print(f"Daily Budget        = {daily} USD/daily")
    print(f"Travel Month        = {month}")
    print(f"Season              = {season}")
    print(f"Transportation      = {transport}")
    print("")
    print_recommended_place(destinations)

destination = input("Destination: ").split(",")
destination = [item.strip() for item in destination]
days = int(input("Days: "))
budget = float(input("Budget: "))
month = input("Travel Month: ")

print_trip_summary(destination, days, budget, month)

