def gcd(a,b):
    return gcd(b,a%b) if b else a

def lcm(a,b):
    return a/gcd(a,b)*b

print (reduce(lcm,range(2,10)))