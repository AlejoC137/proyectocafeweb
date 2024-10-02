

// Simulated Google sign-in function



"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FcGoogle } from "react-icons/fc"; // Importa el ícono de Google

// Simulated Google sign-in function
const signInWithGoogle = async () => {
  console.log("Signing in with Google")
}

export function AuthFormComponent() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (isLogin) {
      console.log("Iniciar sesión:", { email, password })
    } else {
      console.log("Registrar usuario:", { email, password })
    }
  }

  const toggleForm = () => setIsLogin(!isLogin)

  return (
    <Card className="w-screen">
      <CardHeader>
        <CardTitle>{isLogin ? "Iniciar sesión" : "Registrarse"}</CardTitle>
        <CardDescription>
          {isLogin
            ? "Ingresa tus credenciales para acceder"
            : "Crea una nueva cuenta para comenzar"}  
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Introduce tu correo"
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
                placeholder="Introduce tu contraseña"
                required
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button className="w-full" type="submit">
          {isLogin ? "Iniciar sesión" : "Registrarse"}
        </Button>
        <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
          <FcGoogle className="mr-2 h-4 w-4" />
          {isLogin ? "Iniciar sesión con Google" : "Registrarse con Google"}
        </Button>
        <Button variant="link" onClick={toggleForm}  >
          {isLogin ? "¿Nuevo usuario? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </Button>
      </CardFooter>
    </Card>
  )
}
