"""
>
>> while True:
...     div=True
...     for j in range(1, 10):
...             if i%j is not 0:
...                     div = False
...     if div is False:
...             print(i)
...             i+=1
...     else:
...             break
"""

i=232792560
while True:
    div=True
    for j in range(1, 35):
        if i%j is not 0:
            div = False
    if div is False:
        print(i)
        i+=20
    else:
        break