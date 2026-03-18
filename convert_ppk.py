"""
Convierte Wolfmedic-final.ppk (PuTTY-User-Key-File-2) a formato OpenSSH PEM.
"""
import base64, struct
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateNumbers, RSAPublicNumbers
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.backends import default_backend

PPK_PATH = r"D:\Wolfmedic-final.ppk"
OUT_PATH = r"d:\OneDrive\Desarr\Proyectos\GOI\wolfmedic.pem"

def read_mpint(data, offset):
    length = struct.unpack_from(">I", data, offset)[0]
    offset += 4
    value = int.from_bytes(data[offset:offset+length], "big")
    return value, offset + length

# Read all lines
with open(PPK_PATH, "r") as f:
    lines = [l.rstrip("\r\n") for l in f.readlines()]

# Parse by scanning for known section markers
fields = {}
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("PuTTY-User-Key-File-"):
        k, _, v = line.partition(": ")
        fields["type"] = v
    elif ": " in line:
        k, _, v = line.partition(": ")
        key = k.strip()
        if key == "Public-Lines":
            count = int(v.strip())
            pub_lines = lines[i+1:i+1+count]
            fields["pub"] = base64.b64decode("".join(pub_lines))
            i += count
        elif key == "Private-Lines":
            count = int(v.strip())
            priv_lines = lines[i+1:i+1+count]
            fields["priv"] = base64.b64decode("".join(priv_lines))
            i += count
        else:
            fields[key] = v
    i += 1

print("Keys found:", list(fields.keys()))

pub_raw = fields["pub"]
priv_raw = fields["priv"]

# Parse public key blob
off = 0
ktype_len = struct.unpack_from(">I", pub_raw, off)[0]; off += 4
ktype = pub_raw[off:off+ktype_len].decode(); off += ktype_len
print("Key type:", ktype)
e, off = read_mpint(pub_raw, off)
n, off = read_mpint(pub_raw, off)

# Parse private key blob (no passphrase = unencrypted)
off = 0
d, off = read_mpint(priv_raw, off)
p, off = read_mpint(priv_raw, off)
q, off = read_mpint(priv_raw, off)
iqmp, off = read_mpint(priv_raw, off)

dmp1 = d % (p - 1)
dmq1 = d % (q - 1)

pub_numbers = RSAPublicNumbers(e=e, n=n)
priv_numbers = RSAPrivateNumbers(p=p, q=q, d=d, dmp1=dmp1, dmq1=dmq1, iqmp=iqmp, public_numbers=pub_numbers)
private_key = priv_numbers.private_key(default_backend())

pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
with open(OUT_PATH, "wb") as f:
    f.write(pem)

print(f"Clave convertida exitosamente: {OUT_PATH}")
