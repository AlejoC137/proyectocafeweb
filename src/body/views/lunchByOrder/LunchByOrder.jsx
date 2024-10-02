'use client';

import { NumberGridComponent } from '@/components/number-grid'; // Import the component
import { AuthFormComponent } from '@/components/auth-form'; // Import the component
import { RegisterFormComponent } from '@/components/register-form'; // Import the component

function LunchByOrder() {
  return (
    <div className="flex flex-col w-screen border pt-3">
      <NumberGridComponent />  {/* Render the component using JSX */}
      <AuthFormComponent />  {/* Render the component using JSX */}
      <RegisterFormComponent />  {/* Render the component using JSX */}
      {/* hi */}
    </div>
  );
}

export default LunchByOrder;
