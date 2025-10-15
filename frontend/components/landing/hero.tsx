import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { HealthCheck } from '@/components/health-check'

export function Hero() {
    return (
        <section className="bg-muted/50 dark:bg-background overflow-hidden">
            <div className="relative mx-auto max-w-5xl px-6 pt-28 lg:pt-24">
                <div className="relative z-10 mx-auto max-w-2xl text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full border px-8 py-2">
                            <HealthCheck />
                        </div>
                    </div>
                    <h1 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl">
                        Modern Software testing reimagined
                    </h1>
                    <p className="text-muted-foreground mx-auto my-8 max-w-2xl text-xl">
                        Officiis laudantium excepturi ducimus rerum dignissimos, and tempora nam vitae, excepturi ducimus iste provident dolores.
                    </p>

                    <Button
                        asChild
                        size="lg">
                        <Link href="#">
                            <span className="btn-label">Start Building</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mx-auto 2xl:max-w-7xl">
                <div className="perspective-distant pl-8 lg:pl-44">
                    <div className="lg:h-176 rotate-x-20 mask-b-from-55% mask-b-to-100% mask-r-from-75% skew-x-12 pl-6 pt-6">
                        <Image
                            className="rounded-(--radius) border shadow-xl"
                            src="/dark-card.webp"
                            alt="Tailark hero section"
                            width={2880}
                            height={2074}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}