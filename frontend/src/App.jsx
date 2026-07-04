import React, { useState, useEffect } from 'react';
import AuthForm from "./components/AuthForm.jsx";

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://ocrigin-backend.onrender.com/api';

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const [activeTab, setActiveTab] = useState('registro');
  const [characters, setCharacters] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    imageUrl: '',
    age: '',
    birthDate: '',
    origin: '',
    role: 'Protagonista',
    occupation: '',
    maritalStatus: 'Soltero/a',
    description: ''
  });

  useEffect(() => {
    // Carga de la fuente
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    if (isAuthenticated) {
      fetchCharacters();
    }
  }, [isAuthenticated]);


  const fetchCharacters = async () => {
    const token = localStorage.getItem('token');
    try {
      // 🔄 Reemplazado por API_BASE_URL
      const res = await fetch(`${API_BASE_URL}/characters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Identifica al usuario actual
        }
      });
      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      console.error('Error al listar personajes:', err);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImproveText = async () => {
    if (!formData.description.trim()) {
      alert('Por favor, escribe un borrador en la descripción antes de mejorarla.');
      return;
    }
    setAiLoading(true);
    try {
      // 🔄 Reemplazado por API_BASE_URL
      const res = await fetch(`${API_BASE_URL}/improve-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          fullName: formData.fullName
        })
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, description: data.improvedDescription }));
      }
    } catch (err) {
      console.error('Error con el servicio de IA:', err);
    } finally {
      setAiLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return alert('El nombre completo es obligatorio.');

    const token = localStorage.getItem('token');
    try {
      // 🔄 Reemplazado por API_BASE_URL
      const res = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token adjunto
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess('¡Personaje guardado mágicamente en la base de datos!');
        setFormData({
          fullName: '', imageUrl: '', age: '', birthDate: '',
          origin: '', role: 'Protagonista', occupation: '',
          maritalStatus: 'Soltero/a', description: ''
        });
        fetchCharacters();
        setTimeout(() => setSubmitSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };


  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Quieres eliminar la ficha de ${name}?`)) return;

    const token = localStorage.getItem('token');
    try {
      // 🔄 Reemplazado por API_BASE_URL
      const res = await fetch(`${API_BASE_URL}/characters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Valida que seas el dueño
        }
      });
      if (res.ok) fetchCharacters();
    } catch (err) {
      console.error(err);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };


  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={() => setIsAuthenticated(true)} />;
  }


  const styles = {
    container: {
      padding: '40px 20px',
      fontFamily: "'Quicksand', sans-serif",
      maxWidth: '850px',
      margin: '0 auto',
      background: '#fff5f6',
      color: '#5c4d50',
      minHeight: '100vh'
    },
    brandWrapper: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    mainTitle: {
      fontSize: '2.4rem',
      fontWeight: '700',
      color: '#ff758f',
      margin: '0 0 5px 0'
    },
    subtitle: {
      color: '#a38f93',
      margin: '0',
      fontSize: '1rem',
      fontWeight: '500'
    },
    navBar: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px',
      background: '#ffe5ec',
      padding: '6px',
      borderRadius: '16px',
      alignItems: 'center'
    },
    navButton: (isActive) => ({
      flex: 1,
      padding: '12px',
      background: isActive ? '#ffffff' : 'transparent',
      color: isActive ? '#ff758f' : '#a38f93',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'all 0.3s ease',
      boxShadow: isActive ? '0 4px 10px rgba(255, 117, 143, 0.15)' : 'none'
    }),
    logoutBtn: {
      padding: '12px 20px',
      background: '#ff4d6d',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'all 0.3s ease',
    },
    cardLayout: {
      background: '#ffffff',
      padding: '30px',
      borderRadius: '24px',
      boxShadow: '0 10px 25px rgba(255, 182, 193, 0.2)',
      border: '1px solid #fff0f2'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '0.92rem',
      fontWeight: '600',
      color: '#7a666a'
    },
    input: {
      padding: '12px 14px',
      border: '2px solid #ffe5ec',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontFamily: "'Quicksand', sans-serif",
      outline: 'none',
      background: '#fffafb',
      color: '#5c4d50',
      transition: 'border 0.2s'
    },
    textarea: {
      padding: '12px 14px',
      border: '2px solid #ffe5ec',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontFamily: "'Quicksand', sans-serif",
      outline: 'none',
      background: '#fffafb',
      color: '#5c4d50',
      resize: 'vertical',
      lineHeight: '1.5'
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #ff85a1 0%, #ff758f 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '14px',
      fontWeight: '700',
      fontSize: '1.05rem',
      cursor: 'pointer',
      fontFamily: "'Quicksand', sans-serif",
      boxShadow: '0 5px 15px rgba(255, 117, 143, 0.3)',
      transition: 'transform 0.2s'
    },
    aiBtn: {
      background: '#f0e6ff',
      color: '#7b2cbf',
      border: 'none',
      padding: '8px 14px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.85rem',
      cursor: 'pointer',
      alignSelf: 'flex-start',
      fontFamily: "'Quicksand', sans-serif",
      marginTop: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    characterGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px'
    },
    charCard: {
      background: '#ffffff',
      borderRadius: '20px',
      padding: '20px',
      border: '1px solid #ffe5ec',
      shadow: '0 6px 15px rgba(255, 182, 193, 0.1)',
      display: 'flex',
      gap: '20px',
      position: 'relative',
      color: '#5c4d50'
    },
    avatar: {
      width: '110px',
      height: '110px',
      borderRadius: '16px',
      objectFit: 'cover',
      background: '#ffe5ec',
      border: '3px solid #fff0f2'
    },
    cardContent: {
      flex: 1
    },
    badgeRow: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      margin: '6px 0 10px 0'
    },
    badge: (bg, col) => ({
      background: bg,
      color: col,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: '600'
    }),
    deleteIcon: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      background: 'none',
      border: 'none',
      fontSize: '1.2rem',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.brandWrapper}>
        <h1 style={styles.mainTitle}>🌸 OCrigin 🌸</h1>
        <p style={styles.subtitle}>Estudio de Diseño y Fichas de Personajes</p>
      </div>

      <nav style={styles.navBar}>
        <button style={styles.navButton(activeTab === 'registro')} onClick={() => setActiveTab('registro')}>
          ✨ Crear Nueva Ficha
        </button>
        <button style={styles.navButton(activeTab === 'listado')} onClick={() => { setActiveTab('listado'); fetchCharacters(); }}>
          🎀 Galería de Personajes ({characters.length})
        </button>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </nav>


      {activeTab === 'registro' && (
        <div style={styles.cardLayout}>
          <h3 style={{ margin: '0 0 20px 0', color: '#ff758f' }}>Formulario de Inscripción de OC</h3>

          {submitSuccess && (
            <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '10px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: '600' }}>
              {submitSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre Completo del OC</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Ej: Arthur Pendragon" style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Enlace Imagen de Perfil (URL)</label>
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://ejemplo.com/foto.jpg" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Edad</label>
                <input type="text" name="age" value={formData.age} onChange={handleInputChange} placeholder="Ej: 19 años o Inmortal" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Fecha de Nacimiento</label>
                <input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange} placeholder="Ej: 9 de Septiembre" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>País / Reino / Universo</label>
                <input type="text" name="origin" value={formData.origin} onChange={handleInputChange} placeholder="Ej: Camelot / DC Universe" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Ocupación del OC</label>
                <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Ej: Estudiante de Magia / Caballero" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Rol en la Historia</label>
                <select name="role" value={formData.role} onChange={handleInputChange} style={styles.input}>
                  <option value="Protagonista">Protagonista</option>
                  <option value="Antagonista">Antagonista / Villano</option>
                  <option value="Secundario">Personaje Secundario</option>
                  <option value="Anti-Héroe">Anti-Héroe</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Estado Civil</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} style={styles.input}>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="En una relación">En una relación</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Es complicado">Es complicado</option>
                </select>
              </div>
              <div style={{ ...styles.inputGroup, ...styles.fullWidth }}>
                <label style={styles.label}>Biografía o Descripción Breve</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Escribe los rasgos de tu personaje aquí..." style={styles.textarea} />
                <button type="button" onClick={handleImproveText} style={styles.aiBtn} disabled={aiLoading}>
                  {aiLoading ? 'Mejorando redacción...' : '✨ Mejorar redacción con IA'}
                </button>
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>Guardar Ficha de Personaje</button>
          </form>
        </div>
      )}

      {activeTab === 'listado' && (
        <div style={styles.characterGrid}>
          {characters.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a38f93', padding: '40px' }}>Aún no hay personajes en tu reino mágico. ¡Crea el primero!</p>
          ) : (
            characters.map((char) => (
              <div key={char._id} style={styles.charCard}>
                <img
                  src={char.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                  alt={char.fullName}
                  style={styles.avatar}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=OC'; }}
                />
                <div style={styles.cardContent}>
                  <h3 style={{ margin: '0', color: '#ff758f', fontSize: '1.3rem' }}>{char.fullName}</h3>

                  <div style={styles.badgeRow}>
                    <span style={styles.badge('#ffe5ec', '#ff758f')}>{char.role}</span>
                    <span style={styles.badge('#e8f0fe', '#1a73e8')}>{char.origin || 'Universo Desconocido'}</span>
                    {char.age && <span style={styles.badge('#e6fffa', '#00a389')}>{char.age}</span>}
                  </div>

                  <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#7a666a' }}>
                    <strong>🎂 Cumpleaños:</strong> {char.birthDate || 'No definido'} | <strong>💍 Estado:</strong> {char.maritalStatus}
                  </p>
                  <p style={{ margin: '4px 0 10px 0', fontSize: '0.9rem', color: '#7a666a' }}>
                    <strong>💼 Ocupación:</strong> {char.occupation || 'Ninguna'}
                  </p>
                  <p style={{ margin: '0', fontSize: '0.88rem', fontStyle: 'italic', color: '#5c4d50', lineHeight: '1.4', background: '#fffafb', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #ffb3c1' }}>
                    {char.description}
                  </p>
                </div>
                <button style={styles.deleteIcon} onClick={() => handleDelete(char._id, char.fullName)} title="Eliminar OC">🗑️</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;