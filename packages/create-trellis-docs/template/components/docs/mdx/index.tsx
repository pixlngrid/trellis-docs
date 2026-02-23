import { H1, H2, H3, H4, H5, H6 } from './heading'
import { CodeBlock } from './code-block'
import { Callout } from './callout'
import { Tabs, TabItem } from './tabs'
import { ImageLightbox } from './image-lightbox'
import { Glossary } from '@/components/custom/glossary'
import { Feedback } from '@/components/custom/feedback'
import { FlippingCard } from '@/components/custom/flipping-card'
import { FaqTableOfContents } from '@/components/custom/faq-table-of-contents'
import { Tooltip } from '@/components/docs/tooltip'

export const mdxComponents: Record<string, React.ComponentType<any>> = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  pre: ({ children }: any) => {
    // Extract code element props
    const codeEl = children?.props
    if (codeEl) {
      return (
        <CodeBlock className={codeEl.className} meta={codeEl.meta}>
          {codeEl.children}
        </CodeBlock>
      )
    }
    return <pre>{children}</pre>
  },
  img: ImageLightbox as any,
  Callout,
  Tabs,
  TabItem,
  Glossary,
  Feedback,
  FlippingCard,
  FaqTableOfContents,
  Tooltip,
}
