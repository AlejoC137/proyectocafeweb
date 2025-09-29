import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, AlertCircle, Edit, Trash2, Search, X } from 'lucide-react';

// --- SIMULACIÓN DE REDUX Y DATOS ---
// En una aplicación real, esto vendría de `react-redux`.
const useDispatch = () => (action) => {
  console.log("Dispatching:", action.type);
  if (action.type === 'DELETE_TASK') {
    // Simulamos una respuesta exitosa para la eliminación
    return Promise.resolve({ success: true });
  }
  return Promise.resolve({ success: true, data: { id: new Date().toISOString(), ...action.payload } });
};

const useSelector = (selector) => {
  const mockState = {
    tasks: {
      tasks: [
        { id: 1, task_description: 'Diseñar el plano principal del lobby', category: 'Diseño Arquitectónico', status: 'En Progreso', projects: { name: 'Torre Corporativa' }, staff: { name: 'Ana Vélez' }, stages: { name: 'Diseño' }, project_id: 'p1', staff_id: 's1', stage_id: 'st1' },
        { id: 2, task_description: 'Calcular la carga estructural de las vigas', category: 'Ingeniería Estructural', status: 'Completo', projects: { name: 'Puente Centenario' }, staff: { name: 'Carlos Rojas' }, stages: { name: 'Cálculo' }, project_id: 'p2', staff_id: 's2', stage_id: 'st2' },
        { id: 3, task_description: 'Revisar normativa de sismoresistencia', category: 'Normativa', status: 'Pendiente', projects: { name: 'Torre Corporativa' }, staff: { name: 'Luisa Parra' }, stages: { name: 'Investigación' }, project_id: 'p1', staff_id: 's3', stage_id: 'st3' },
      ],
      loading: false,
      error: null,
    },
    projects: {
      projects: [{ id: 'p1', name: 'Torre Corporativa' }, { id: 'p2', name: 'Puente Centenario' }],
    },
    staff: {
      members: [{ id: 's1', name: 'Ana Vélez' }, { id: 's2', name: 'Carlos Rojas' }, { id: 's3', name: 'Luisa Parra' }],
    },
    stages: {
      stages: [{ id: 'st1', name: 'Diseño' }, { id: 'st2', name: 'Cálculo' }, { id: 'st3', name: 'Investigación' }],
    },
  };
  return selector(mockState);
};

// Simulación de acciones (en un proyecto real, estarían en sus propios archivos)
const fetchTasks = () => ({ type: 'FETCH_TASKS' });
const createTask = (payload) => ({ type: 'CREATE_TASK', payload });
const updateTaskData = (id, payload) => ({ type: 'UPDATE_TASK', payload: { id, ...payload } });
const deleteTaskData = (id) => ({ type: 'DELETE_TASK', payload: { id } });
const fetchProjects = () => ({ type: 'FETCH_PROJECTS' });
const fetchStaff = () => ({ type: 'FETCH_STAFF' });
const fetchStages = () => ({ type: 'FETCH_STAGES' });

// Simulación de tipos de datos
const TaskStatusOptions = ['Pendiente', 'En Diseño', 'En Progreso', 'Aprobación Requerida', 'Bloqueado', 'En Discusión', 'Completo'];
const TaskCategories = ['Diseño Arquitectónico', 'Ingeniería Estructural', 'Normativa', 'Presupuesto', 'Cliente'];

// --- COMPONENTES UI (Versiones simplificadas) ---

const Badge = ({ variant, children, className }) => {
  const baseClasses = 'px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block';
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-yellow-100 text-yellow-800',
    info: 'bg-cyan-100 text-cyan-800',
    warning: 'bg-orange-100 text-orange-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-600',
  };
  return <span className={`${baseClasses} ${variants[variant] || variants.default} ${className}`}>{children}</span>;
};

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const CrudForm = ({ fields, initialData, onSubmit, onCancel, loading, submitText }) => {
  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              rows={field.rows}
              placeholder={field.placeholder}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          ) : field.type === 'select' ? (
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">{field.placeholder}</option>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : null}
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600   rounded-md disabled:bg-blue-300">
          {loading ? 'Guardando...' : submitText}
        </button>
      </div>
    </form>
  );
};

const DataTable = ({ title, description, data, columns, loading, onAdd, onEdit, onDelete, searchPlaceholder, emptyMessage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredData = data.filter(item => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600   rounded-md">
                        <Plus size={16} /> Agregar
                    </button>
                </div>
                <div className="mt-4 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(col => <th key={col.key} className="p-3 text-left font-medium text-gray-600">{col.title}</th>)}
                            <th className="p-3 text-right font-medium text-gray-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={columns.length + 1} className="p-4 text-center">Cargando...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="p-4 text-center">{emptyMessage}</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    {columns.map(col => (
                                        <td key={col.key} className={`p-3 align-top ${col.className || ''}`}>
                                            {col.render ? col.render(item[col.key] || item, item) : item[col.key]}
                                        </td>
                                    ))}
                                    <td className="p-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                                            <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---

const TasksPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector(state => state.tasks);
  const { projects } = useSelector(state => state.projects);
  const { members: staff } = useSelector(state => state.staff);
  const { stages } = useSelector(state => state.stages);
  
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
    dispatch(fetchStaff());
    dispatch(fetchStages());
  }, [dispatch]);

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'Pendiente': 'secondary',
      'En Diseño': 'info',
      'En Progreso': 'default',
      'Aprobación Requerida': 'warning',
      'Bloqueado': 'destructive',
      'En Discusión': 'warning',
      'Completo': 'success',
    };
    return variants[status] || 'default';
  };

  const taskColumns = [
    {
      key: 'task_description',
      title: 'Descripción de la Tarea',
      className: 'max-w-md',
      render: (value) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: 'category',
      title: 'Categoría',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'status',
      title: 'Estado',
      render: (value) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'projects',
      title: 'Proyecto',
      render: (value) => (
        value?.name || 'No asignado'
      )
    },
    {
      key: 'staff',
      title: 'Responsable',
      render: (value) => (
        value?.name || 'No asignado'
      )
    },
    {
      key: 'stages',
      title: 'Etapa',
      render: (value) => (
        value?.name || 'Sin etapa'
      )
    }
  ];

  const taskFormFields = [
    {
      name: 'task_description',
      label: 'Descripción de la Tarea',
      type: 'textarea',
      required: true,
      rows: 3,
      placeholder: 'Describe la tarea a realizar...'
    },
    {
      name: 'category',
      label: 'Categoría',
      type: 'select',
      required: true,
      placeholder: 'Selecciona una categoría',
      options: TaskCategories.map(category => ({
        value: category,
        label: category
      }))
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      placeholder: 'Selecciona el estado',
      options: TaskStatusOptions.map(status => ({
        value: status,
        label: status
      }))
    },
    {
      name: 'project_id',
      label: 'Proyecto',
      type: 'select',
      placeholder: 'Selecciona un proyecto (opcional)',
      options: projects.map(project => ({
        value: project.id,
        label: project.name
      }))
    },
    {
      name: 'staff_id',
      label: 'Responsable',
      type: 'select',
      placeholder: 'Asignar responsable (opcional)',
      options: staff.map(member => ({
        value: member.id,
        label: member.name
      }))
    },
    {
      name: 'stage_id',
      label: 'Etapa del Proyecto',
      type: 'select',
      placeholder: 'Selecciona una etapa (opcional)',
      options: stages.map(stage => ({
        value: stage.id,
        label: stage.name
      }))
    },
    {
      name: 'notes',
      label: 'Notas Adicionales',
      type: 'textarea',
      rows: 2,
      placeholder: 'Información adicional, dependencias, observaciones...'
    }
  ];

  const handleAdd = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEdit = (task) => {
    const taskForEdit = {
      ...task,
      project_id: task.project_id || '',
      staff_id: task.staff_id || '',
      stage_id: task.stage_id || ''
    };
    setEditingTask(taskForEdit);
    setShowModal(true);
  };

  const handleDelete = async (task) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la tarea "${task.task_description}"?`)) {
      const result = await dispatch(deleteTaskData(task.id));
      if (!result.success) {
        alert('Error al eliminar: ' + result.error);
      } else {
         alert('Tarea eliminada (simulado). En una app real, la lista se actualizaría.');
      }
    }
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const processedData = {
        ...formData,
        project_id: formData.project_id || null,
        staff_id: formData.staff_id || null,
        stage_id: formData.stage_id || null
      };

      let result;
      if (editingTask) {
        result = await dispatch(updateTaskData(editingTask.id, processedData));
      } else {
        result = await dispatch(createTask(processedData));
      }
      
      if (result.success) {
        alert('Operación exitosa (simulado). La lista se actualizaría.');
        setShowModal(false);
        setEditingTask(null);
      } else {
        alert('Error: ' + (result.error || 'Ocurrió un error.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Tareas</h1>
        </div>
        <p className="text-gray-600">
          Administra todas las tareas del proyecto y su estado de avance.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>Error: {error}</p>
        </div>
      )}

      <DataTable
        title="Lista de Tareas"
        description="Todas las tareas del proyecto organizadas por estado y responsable"
        data={tasks}
        columns={taskColumns}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar tareas por descripción, categoría..."
        emptyMessage="No hay tareas registradas"
      />

      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
        size="xl"
      >
        <CrudForm
          fields={taskFormFields}
          initialData={editingTask || { status: 'Pendiente', category: TaskCategories[0] }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          submitText={editingTask ? 'Actualizar' : 'Crear'}
        />
      </Modal>
    </div>
  );
};

export default TasksPage;