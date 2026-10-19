# Landing people photos (public/landing-v8/ph)

Real photographs of real people from Pexels, under the Pexels License (https://www.pexels.com/license/):
free for commercial use, no attribution required, no AI-generated faces. Edits made here: crop,
resize, a light cool grade (saturation -12%, slightly cooler) so every photo sits on the atlas palette,
WebP + AVIF encode. The names shown next to these faces on the landing are EXAMPLE guests inside
example bookings, never customers and never testimonials. Real customer quotes live only in
src/config/testimonials.js (empty until a customer gives written consent).

Not used: Unsplash+ / premium, Canva AI, any generated image.

## Avatars (192px, used as example guests: hero notification, facts stack, final CTA, chips)
| file | source | photographer |
|---|---|---|
| f-noa.webp | https://www.pexels.com/photo/young-woman-smiling-outdoors-in-sunlight-30372403/ | Büşranur Aydın |
| f-maya.webp | https://www.pexels.com/photo/3290499/ (Woman Smiling While Standing Beside Fence) | Engin Akyurt |
| f-shir.webp | https://www.pexels.com/photo/smiling-woman-having-breakfast-4038110/ | cottonbro studio |
| f-tom.webp | https://www.pexels.com/photo/33831641/ (Smiling man by the sea) | Eyüpcan Timur |
| f-ben.webp | https://www.pexels.com/photo/man-gazing-out-from-a-balcony-in-contemplation-37654299/ | Svet Svet |
| f-yossi.webp | https://www.pexels.com/photo/smiling-elderly-man-in-naxos-greece-portrait-38054875/ | Pete Miller Portraits |
| f-adam.webp | https://www.pexels.com/photo/close-up-photo-of-bearded-elderly-man-13539005/ | Muhammed Akturk |
| f-eli.webp | https://www.pexels.com/photo/14489613/ (Smiling Man on Cliff by Sea) | Lokman Sevim |

## Scenes (AVIF + WebP, two widths each, lazy)
| file | slot | source | photographer |
|---|---|---|---|
| p-hostess-{560,1000} | today block (version B), owner hosting on the porch, with the real atlas Today screen in a phone over it | https://www.pexels.com/photo/woman-holding-two-platters-of-bread-10020187/ | Ron Lach |
| p-host-{480,840} | payments block, host at the laptop | https://www.pexels.com/photo/man-working-at-laptop-in-garden-cafe-24604951/ | David Escala de Almeida |

Older files m-*.webp / n-*.webp (previous set, sources not recorded) are no longer referenced by the live
landing (LandingM) and can be deleted once no open PR uses them.
