import React, { useState } from 'react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ocrigin-backend.onrender.com/api';

const AuthForm = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const url = `${API_BASE_URL}${endpoint}`;

        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : formData;

        console.log("Intentando enviar petición a:", url);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {

                alert(data.error || `Error en el servidor: Código ${response.status}`);
                return;
            }


            if (data.success) {
                if (isLogin) {

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    alert(`¡Bienvenido de vuelta, ${data.username}!`);
                    onAuthSuccess();
                } else {
                    alert('¡Registro exitoso! Ya puedes iniciar sesión.');
                    setFormData({ username: '', email: '', password: '' });
                    setIsLogin(true);
                }
            }
        } catch (error) {
            console.error('Error real en la petición:', error);
            alert('No se pudo establecer conexión física con el servidor. Asegúrate de que el backend en Render esté activo.');
        }
    };

    return (
        <div style={styles.authContainer}>
            <div style={styles.authCard}>
                <h2 style={styles.title}>{isLogin ? '🌸 OCrigin Login' : '✨ Crear Cuenta'}</h2>
                <p style={styles.subtitle}>{isLogin ? 'Ingresa a tu estudio' : 'Regístrate'}</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Nombre de Usuario</label>
                            <input type="text" name="username" value={formData.username} onChange={handleInputChange} style={styles.input} required />
                        </div>
                    )}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Correo Electrónico</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={styles.input} required />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Contraseña</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} style={styles.input} required />
                    </div>
                    <button type="submit" style={styles.submitBtn}>
                        {isLogin ? 'Entrar al Sistema' : 'Finalizar Registro'}
                    </button>
                </form>

                <p style={styles.toggleText}>
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                    <span onClick={() => setIsLogin(!isLogin)} style={styles.toggleLink}>
                        {isLogin ? ' Regístrate' : ' Inicia sesión'}
                    </span>
                </p>
            </div>
        </div>
    );
};

const styles = {
    authContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fff5f6', padding: '20px', fontFamily: "'Quicksand', sans-serif" },
    authCard: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(255, 182, 193, 0.2)', textAlign: 'center' },
    title: { color: '#ff758f', fontSize: '2rem', margin: '0 0 10px 0' },
    subtitle: { color: '#a38f93', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { color: '#7a666a', fontSize: '0.92rem', fontWeight: '600' },
    input: { padding: '12px', borderRadius: '12px', border: '2px solid #ffe5ec', outline: 'none' },
    submitBtn: { padding: '14px', background: '#ff758f', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700' },
    toggleText: { color: '#a38f93', marginTop: '20px' },
    toggleLink: { color: '#ff758f', cursor: 'pointer', fontWeight: '700' }
};

export default AuthForm;