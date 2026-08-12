def print_trip_summary(
    destination,
    country,
    days,
    budget,
    currency,
    travel_month
):

    print("=======================")
    print("KelanaAI")
    print("=======================")
    print(f"Destination     : {destination}")
    print(f"Country         : {country}")
    print(f"Days            : {days}")
    print(f"Budget          : {budget}")
    print(f"Currency        : {currency}")
    print(f"Month of Travel : {travel_month}")

destination  = input("Destination : ")
country      = input("Country : ")
days         = int(input("days : "))
budget       = float(input("budget : "))
currency     = input("Currency : ")
travel_month = input("Month of Travel : ")

print_trip_summary(
    destination,
    country,
    days,
    budget,
    currency,
    travel_month
)