destination = input("Destination : ")
days = int(input("days : "))
budget = float(input("budget : "))
travel_style = input("Style : ")

print(f"Destination : {destination}")
print(f"Days : {days}")
print(f"Budget : {budget}")
print(f"Style : {travel_style}")

def print_trip_summary(destination, days, budget, travel_stle):
    print("=======================")
    print("KelanaAI")
    print("=======================")
    print(f"Destinatisi : {destination}")
    print(f"Days        : {days}")
    print(f"Budget      : {budget}")
    print(f"Style       : {travel_stle}")

print_trip_summary("Japan", 5, 1500, "Family")