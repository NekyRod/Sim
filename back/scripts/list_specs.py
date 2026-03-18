import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import especialidades_repo
try:
    specs = especialidades_repo.listar_especialidades()
    with open('scripts/specs_output.txt', 'w', encoding='utf-8') as f:
        for s in specs:
            f.write(json.dumps(s) + '\n')
    print("Done writing to file")
except Exception as e:
    print(e)
