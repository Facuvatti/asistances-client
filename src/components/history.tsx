import { useState } from 'react';
import { buildFormBody, httpRequest } from '../api';
import { AttendanceRecord } from '../types';

function History({user}: {user: string | undefined}) {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [formMessage, setFormMessage] = useState('');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const body = buildFormBody(event.currentTarget);
        if (!body) {
            setFormMessage('Complete todos los campos antes de enviar.');
            return;
        }
        if(!user) return;
        const response = (await httpRequest<AttendanceRecord[]>('asistances/get', 'POST', body)) || [];
        setRecords(Array.isArray(response) ? response : []);
        formMessage && setFormMessage('Operación correcta.');
        setTimeout(() => setFormMessage(''), 3000);
    }

    return (
        <div className="container">
            <h2>Historial de asistencias</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="course">Curso:</label>
                    <select name="course" id="course">
                        <option value="">Seleccione un curso</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="date">Fecha:</label>
                    <input type="date" name="date" id="date" />
                </div>
                <button type="submit">Buscar</button>
            </form>
            {   
                <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Apellido</th>
                            <th>Nombre</th>
                            <th>Presencia</th>
                            <th>Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id}>
                                <td>{record.lastname}</td>
                                <td>{record.name}</td>
                                <td>{record.presence ? 'Presente' : 'Ausente'}</td>
                                <td>{record.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            }
            {formMessage && <p>{formMessage}</p>}
        </div>
    )
}

export default History