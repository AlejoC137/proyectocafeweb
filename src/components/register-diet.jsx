"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc"; // Reemplaza LucideGoogle por FcGoogle
import { useToast } from "@/hooks/use-toast"; // Asegúrate de que la ruta sea correcta

// Simulated Google sign-up function
const signUpWithGoogle = async () => {
  console.log("Signing up with Google");
};

export function RegisterFormComponent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    // Aquí típicamente enviarías los datos al backend para registrar el usuario
    console.log("Registrar usuario:", { name, email, password });
    toast({
      title: "Registro exitoso",
      description: "Tu cuenta ha sido creada.",
    });
  };

  return (
    <Card className="w-screen">
      <CardHeader>
        <CardTitle>Registrarse</CardTitle>
        <CardDescription>
          Crea una nueva cuenta para comenzar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo electrónico"
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crea una contraseña segura"
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                required
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button className="w-full" type="submit" onClick={handleFormSubmit}>
          Crear cuenta
        </Button>
        <Button variant="outline" className="w-full" onClick={signUpWithGoogle}>
          <FcGoogle className="mr-2 h-4 w-4" />
          Registrarse con Google
        </Button>
        <div className="text-sm text-center text-gray-500">
          ¿Ya tienes una cuenta?{" "}
          <a
            href="/login"
            className="text-slate-900 hover:underline dark:text-slate-50"
          >
            Inicia sesión
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
