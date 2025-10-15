import { Button } from '@/components/ui/button'

export default function Dashboard() {
    return (
        <div className="min-h-screen">
            <div className="border-b bg-background">
                <div className="mx-auto max-w-7xl px-6 py-4">
                    <Button
                        asChild
                        variant="outline"
                        size="sm">
                        <a href="http://localhost:8000/logout">
                            <span>Sign out</span>
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}