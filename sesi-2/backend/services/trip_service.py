def calculate_daily_budget(budget, days):
    return budget/days

def get_trip_category(budget):
    if budget < 1000:
        category = "Backpacker"
    elif budget <= 3000:
        category = "Standard"
    else:
        category = "Luxury"

    return category

def get_travel_season(month):
    if month == "December":
        return "Peak Season"
    elif month == "June":
        return "Holiday Season"
    else:
        return "Regular Season"

def get_transportation_recommendation(category):
    if category == "Backpacker":
        return "Bus"
    elif category == "Standard":
        return "Train"
    else:
        return "Flight"

def get_destination_recommendation(destination):
    recommendation = {
        "Japan": ["Tokyo Tower", "Shibuya", "Mount Fuji"],
        "Singapore": ["Marina Bay", "Chinatown", "Singapore River"],
        "Australia": ["Sydney", "Melbourne", "Perth"],
        "Kanada": ["Toronto", "Quebec", "Ottawa"]
    }
    
    return recommendation.get(destination, [])