edo12 = [440.0 * pow(2, i / 12) for i in range(12)]
edo55 = [440.0 * pow(2, i / 55) for i in range(55)]
near = [False for _ in range(55)]

for i in range(12):
    minValue = [1000, 1000]
    for j in range(55):
        minValue = min(minValue, [abs(edo12[i] - edo55[j]), j])
    near[minValue[1]] = True
    print(edo12[i], edo55[minValue[1]])

color1 = "#F0F0F0"
color2 = "#DADADA"
color3 = "#B0B0B0"
for i in range(55):
    if near[i]:
        print(color2)
    else:
        print(color3)
print(edo12)