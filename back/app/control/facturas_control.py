# app/control/facturas_control.py
from fastapi import HTTPException
from app.database import facturas_repo


def crear_factura(data: dict):
    items = data.get('items', [])
    if not items:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un servicio")
    if not data.get('paciente_id'):
        raise HTTPException(status_code=400, detail="paciente_id es obligatorio")

    for item in items:
        if not item.get('codigo_cups') or not item.get('descripcion'):
            raise HTTPException(status_code=400, detail="Cada ítem requiere codigo_cups y descripcion")
        if float(item.get('valor_unitario', 0)) < 0:
            raise HTTPException(status_code=400, detail="El valor unitario no puede ser negativo")
        if int(item.get('cantidad', 1)) < 1:
            raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")

    try:
        factura = facturas_repo.create_factura(data)
        return {"id": factura['id'], "numero_factura": factura['numero_factura'], "total": float(factura['total']), "data": factura}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando factura: {str(e)}")


def listar_facturas(paciente_id=None, estado=None, fecha_desde=None, fecha_hasta=None):
    try:
        facturas = facturas_repo.get_facturas(
            paciente_id=paciente_id, estado=estado,
            fecha_desde=fecha_desde, fecha_hasta=fecha_hasta
        )
        return {"data": facturas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listando facturas: {str(e)}")


def obtener_factura(factura_id: int):
    factura = facturas_repo.get_factura_by_id(factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail=f"Factura {factura_id} no encontrada")
    return factura


def anular_factura(factura_id: int):
    rows = facturas_repo.anular_factura(factura_id)
    if rows == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada o ya está anulada")
    return {"message": "Factura anulada correctamente"}
