from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from datetime import date
import re

class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    correo: str = Field(..., max_length=150)
    contrasena: str = Field(..., min_length=8, max_length=72)

    @field_validator("correo")
    @classmethod
    def validar_correo(cls, v):
        pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Correo no válido")
        return v.lower().strip()

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v):
        if not v.strip():
            raise ValueError("Nombre no puede estar vacío")
        return v.strip()

class UsuarioLogin(BaseModel):
    correo: str
    contrasena: str

class CategoriaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=50)
    tipo: str = Field(..., pattern="^(ingreso|gasto)$")
    id_usuario: int = Field(..., gt=0)

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v):
        if not v.strip():
            raise ValueError("Nombre no puede estar vacío")
        return v.strip()

class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=50)
    tipo: Optional[str] = Field(None, pattern="^(ingreso|gasto)$")

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Nombre no puede estar vacío")
        return v.strip() if v else v

class MovimientoCreate(BaseModel):
    id_usuario: int = Field(..., gt=0)
    id_categoria: int = Field(..., gt=0)
    tipo: str = Field(..., pattern="^(ingreso|gasto)$")
    monto: float = Field(..., gt=0, le=9999999999.99)
    fecha: date
    descripcion: Optional[str] = Field(None, max_length=255)

    @field_validator("descripcion")
    @classmethod
    def validar_desc(cls, v):
        if v is not None:
            return v.strip() or None
        return v

class MovimientoUpdate(BaseModel):
    id_categoria: Optional[int] = Field(None, gt=0)
    tipo: Optional[str] = Field(None, pattern="^(ingreso|gasto)$")
    monto: Optional[float] = Field(None, gt=0, le=9999999999.99)
    fecha: Optional[date] = None
    descripcion: Optional[str] = Field(None, max_length=255)
