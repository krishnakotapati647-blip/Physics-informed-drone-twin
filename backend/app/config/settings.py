"""
Configuration — reads from environment variables.
Never hard-code secrets.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    # Simulation
    telemetry_hz: float = 10.0          # Target telemetry frequency
    physics_dt: float = 0.02           # Physics timestep seconds (50 Hz)
    drone_id: str = "DRONE-001"

    # Firebase (optional — set via .env)
    firebase_credentials_path: str = ""
    firebase_project_id: str = ""

    # Physics defaults
    drone_mass_kg: float = 1.5
    battery_capacity_mah: float = 5200.0
    battery_voltage: float = 14.8      # 4S LiPo
    num_motors: int = 4
    motor_kv: float = 920.0            # RPM per volt
    rotor_radius_m: float = 0.127      # 5-inch props
    motor_thrust_coeff: float = 2.5e-7 # T = k * RPM^2 (SI units)
    motor_drag_coeff: float = 5.0e-9   # drag torque
    max_rpm: float = 8000.0
    nominal_rpm: float = 5500.0
    drag_coefficient: float = 0.47
    frontal_area_m2: float = 0.04

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
