"'use client'"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function ToastExampleComponent() {
  const { toast } = useToast()

  const showToast = () => {
    toast({
      title: "Scheduled: Catch up",
      description: "Friday, February 10, 2023 at 5:57 PM",
    })
  }

  return (<Button onClick={showToast}>Show Toast</Button>);
}