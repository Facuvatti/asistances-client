import { httpRequest } from './api';
import { Role } from './types';

export interface DemoUser {
  username: string;
  name: string;
  role: Role;
  description: string;
}

export interface DemoInfo {
  enabled: boolean;
  users: DemoUser[];
}

/** Pregunta a la API si está en modo demo (DEMO_MODE=true) y qué usuarios demo hay. */
export async function fetchDemo(): Promise<DemoInfo> {
  try {
    const info = await httpRequest<DemoInfo>('demo');
    return { enabled: Boolean(info?.enabled), users: info?.users ?? [] };
  } catch {
    return { enabled: false, users: [] };
  }
}

export const demoLogin = (username: string) => httpRequest('demo/login', 'POST', { username });
export const demoReset = () => httpRequest('demo/reset', 'POST');

// Qué probar con cada rol, para entender cómo se conectan los roles entre sí.
export const DEMO_TIPS: Record<Role, string> = {
  admin: 'Entrá a Usuarios: creá cuentas de a una o importá un CSV. En Historial las asistencias son solo lectura.',
  preceptor: 'Tomá la asistencia del curso 5° 2° informatica (cambiá la fecha a 02/11/2026 para ver datos) y mirá "Compartir cursos". Después probá como Profesor.',
  profesor: 'Abrí la materia "programacion" el 02/11/2026: Sofía y Martín aparecen como "heredado" del preceptor. Confirmalos o cambialos.',
  estudiante: 'Solo ves tus asistencias. No hay botones para modificar nada.',
  padre: 'Ves las asistencias de tu hijo (la misma vista que el alumno).',
};
