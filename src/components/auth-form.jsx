'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserRegState } from '../redux/actions';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';

export function AuthFormComponent() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegisterClick = () => {
    dispatch(updateUserRegState('notReg'));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Iniciar sesión con:', { email, password });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5] px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Iniciar sesión</h2>
        <form onSubmit={handleLoginSubmit} className="space-y-4">
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
          <button
            type="submit"
            className="w-full py-3 bg-[#ff6600] text-white font-bold rounded-xl hover:bg-[#e65c00] transition duration-200"
          >
            Iniciar sesión
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          o inicia sesión con
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <button className="bg-[#DB4437] p-3 rounded-full">
            <FaGoogle className="text-white w-6 h-6" />
          </button>
          <button className="bg-[#4267B2] p-3 rounded-full">
            <FaFacebook className="text-white w-6 h-6" />
          </button>
          <button className="bg-black p-3 rounded-full">
            <FaApple className="text-white w-6 h-6" />
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
   
        </div>

        <div className="text-center text-sm mt-6">
        <button onClick={handleRegisterClick} className="text-indigo-600 font-semibold hover:underline bg-white">
            Registrarse
          </button>        </div>
      </div>
    </div>
  );
}
