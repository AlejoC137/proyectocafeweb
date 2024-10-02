'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AuthFormComponent } from '@/components/auth-form';
import { RegisterFormComponent } from '@/components/register-form';
import { updateUserRegState } from '../../../redux/actions';
import PickDiet from './PickDiet';
function LunchByOrder() {
  const dispatch = useDispatch();
  const userRegState = useSelector((state) => state.userRegState);  // Obtener el estado global

  useEffect(() => {
    // Asumir que por defecto el estado es "notAuth"
    if (!userRegState) {
      dispatch(updateUserRegState('notAuth'));
    }
  }, [dispatch, userRegState]);

  const renderComponent = () => {
    switch (userRegState) {
      case 'notAuth':
        return <AuthFormComponent />;
      case 'notReg':
        return <RegisterFormComponent />;
      case 'authOK':
        return <PickDiet />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-screen ">
      {renderComponent()}
    </div>
  );
}

export default LunchByOrder;
