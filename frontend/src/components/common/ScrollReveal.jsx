import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollReveal — React Bits component
 *
 * Animates children text word-by-word as the user scrolls.
 * Non-text children are treated as a single animated block.
 *
 * Props:
 *  children         ReactNode  — text or elements to animate
 *  scrollContainerRef RefObject — optional container ref (defaults to window)
 *  enableBlur       boolean    — add blur-in effect (default true)
 *  baseOpacity      number     — starting opacity (default 0)
 *  baseRotation     number     — starting X-rotation in degrees (default 3)
 *  blurStrength     number     — max blur in px (default 10)
 *  containerClassName string   — className for the outer wrapper
 *  textClassName    string     — className for each word span
 *  rotationEnd      string     — ScrollTrigger end value (default "bottom bottom")
 *  wordAnimationEnd string     — ScrollTrigger end for each word
 */
function ScrollReveal({
    children,
    scrollContainerRef,
    enableBlur = true,
    baseOpacity = 0,
    baseRotation = 3,
    blurStrength = 10,
    containerClassName = "",
    textClassName = "",
    rotationEnd = "bottom bottom",
    wordAnimationEnd = "bottom bottom",
}) {
    const containerRef = useRef(null);

    // Split string children into word spans; keep other nodes as-is
    const elements = useMemo(() => {
        if (typeof children === "string") {
            return children.split(" ").map((word, i) => (
                <span
                    key={i}
                    className={"inline-block will-change-transform " + textClassName}
                    style={{ marginRight: "0.25em" }}
                >
                    {word}
                </span>
            ));
        }

        if (Array.isArray(children)) {
            return children.flatMap((child, i) => {
                if (typeof child === "string") {
                    return child.split(" ").map((word, j) => (
                        <span
                            key={i + "-" + j}
                            className={"inline-block will-change-transform " + textClassName}
                            style={{ marginRight: "0.25em" }}
                        >
                            {word}
                        </span>
                    ));
                }
                return (
                    <span
                        key={i}
                        className={"inline-block will-change-transform " + textClassName}
                    >
                        {child}
                    </span>
                );
            });
        }

        // Single non-string child
        return (
            <span className={"inline-block will-change-transform " + textClassName}>
                {children}
            </span>
        );
    }, [children, textClassName]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scroller = scrollContainerRef?.current || undefined;

        // Animate the container rotation
        const rotationTl = gsap.fromTo(
            container,
            { rotateX: baseRotation },
            {
                rotateX: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: container,
                    scroller,
                    start: "top bottom",
                    end: rotationEnd,
                    scrub: true,
                },
            }
        );

        // Animate each word span
        const wordSpans = container.querySelectorAll("span");

        const wordTls = Array.from(wordSpans).map((span) => {
            const fromVars = {
                opacity: baseOpacity,
                willChange: "opacity, transform",
                ...(enableBlur ? { filter: "blur(" + blurStrength + "px)" } : {}),
            };
            const toVars = {
                opacity: 1,
                ease: "none",
                ...(enableBlur ? { filter: "blur(0px)" } : {}),
                scrollTrigger: {
                    trigger: span,
                    scroller,
                    start: "top bottom-=20%",
                    end: wordAnimationEnd,
                    scrub: true,
                },
            };
            return gsap.fromTo(span, fromVars, toVars);
        });

        return () => {
            rotationTl.scrollTrigger?.kill();
            rotationTl.kill();
            wordTls.forEach((tl) => {
                tl.scrollTrigger?.kill();
                tl.kill();
            });
        };
    }, [
        scrollContainerRef,
        enableBlur,
        baseOpacity,
        baseRotation,
        blurStrength,
        rotationEnd,
        wordAnimationEnd,
    ]);

    return (
        <div
            ref={containerRef}
            style={{ perspective: "1000px" }}
            className={containerClassName}
        >
            {elements}
        </div>
    );
}

export default ScrollReveal;
