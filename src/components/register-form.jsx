'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserRegState } from '../redux/actions';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';

export function RegisterFormComponent() {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleContinueClick = () => {
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    dispatch(updateUserRegState('authOK'));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5] px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Crear una cuenta</h2>
        <form className="space-y-4">
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-4 border border-gray-300 rounded-xl bg-white placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 border border-gray-300 rounded-xl bg-white placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 border border-gray-300 rounded-xl bg-white placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-4 border border-gray-300 rounded-xl bg-white placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
          <button
            type="button"
            onClick={handleContinueClick}
            className="w-full py-3 bg-[#ff6600] text-white font-bold rounded-xl hover:bg-[#e65c00] transition duration-200"
          >
            Crear cuenta
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          o regístrate con
        </div>

        <div className="flex justify-center gap-2 mt-2">
          <button className="bg-[#DB4437] p-1 rounded-2">
            <FaGoogle className="text-white w-4 h-4" />
          </button>
          <button className="bg-[#4267B2] p-1 rounded-2">
            <FaFacebook className="text-white w-4 h-4" />
          </button>
          <button className="bg-black p-1 rounded-2">
            <FaApple className="text-white w-4 h-4" />
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes una cuenta?{' '}
        </div>

        <div className="text-center text-sm mt-6">
        <button className="text-indigo-600 font-semibold hover:underline bg-white">Iniciar sesión</button>
        </div>
      </div>
    </div>
  );
}
