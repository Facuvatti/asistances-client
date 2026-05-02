import { useState, useEffect } from 'react';
import { httpRequest, buildFormBody } from '../api';
import { Course } from '../types';
import { fetchCourses } from '../utils';
type LoadMode = 'Curso' | 'Materia' | 'Estudiantes';
function Load() {
  const [mode, setMode] = useState<LoadMode>('Curso');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCourses( setCourses, setSelectedCourse);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = buildFormBody(form);
    if (!body) {
      setMessage('Complete todos los campos antes de enviar.');
      return;
    }

    if (mode === 'Curso') {
      await httpRequest('courses', 'POST', body);
      setMessage('Curso creado correctamente.');
    }

    if (mode === 'Materia') {
      await httpRequest('subjects', 'POST', body);
      setMessage('Materia creada correctamente.');
    }

    if (mode === 'Estudiantes') {
      await httpRequest('students', 'POST', body);
      setMessage('Estudiantes cargados correctamente.');
    }

    form.reset();
    setTimeout(() => setMessage(''), 4000);
  }

  const studentsMode = mode === 'Estudiantes';

  return (
    <div className="container">
      <h2>Carga de datos</h2>
      <div>
        <select value={mode} onChange={(event) => setMode(event.target.value as LoadMode)}>
          <option>Curso</option>
          <option>Materia</option>
          <option>Estudiantes</option>
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'Curso' && (
          <>
            <input name="year" placeholder="AÑO" />
            <input name="division" placeholder="DIVISIÓN" />
            <input name="specialty" placeholder="ESPECIALIDAD" />
          </>
        )}

        {mode === 'Materia' && (
          <>
            <select name="course">
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.year} {course.division} {course.specialty}
                </option>
              ))}
            </select>
            <input name="subject" placeholder="ASIGNATURA" />
            <input name="teacher" placeholder="PROFESOR" />
            <input name="hours" placeholder="HORAS" />
          </>
        )}

        {studentsMode && (
          <>
            <select name="course">
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.year} {course.division} {course.specialty}
                </option>
              ))}
            </select>
            <textarea name="students" rows={8} placeholder={"APELLIDO NOMBRE\nAPELLIDO NOMBRE"} />
          </>
        )}

        <button type="submit">Enviar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Load;