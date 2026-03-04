'use client'

import React, { useState, ReactElement } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'

interface Feature {
  id: string
  title: string
  description: string
  link: string
  imageGradient: string
  visualElement: ReactElement
}

const features: Feature[] = [
  {
    id: 'mdx-variables',
    title: 'MDX Variables',
    description:
      "Define product names, versions, and terms once in a config file. Use them across every page — something Docusaurus can't do.",
    link: '/guides/docs/',
    imageGradient: 'from-purple-400 to-indigo-500',
    visualElement: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="100" height="120" rx="8" fill="white" opacity="0.9" />
        <rect x="45" y="40" width="70" height="8" rx="4" fill="#8B5CF6" opacity="0.6" />
        <rect x="45" y="60" width="50" height="6" rx="3" fill="#A78BFA" opacity="0.5" />
        <rect x="45" y="75" width="60" height="6" rx="3" fill="#A78BFA" opacity="0.5" />
        <text x="50" y="105" fill="#6366F1" fontSize="32" fontWeight="bold" fontFamily="monospace">
          $
        </text>
        <text x="75" y="105" fill="#8B5CF6" fontSize="32" fontWeight="bold" fontFamily="monospace">
          {'{}'}
        </text>
        <circle cx="80" cy="140" r="4" fill="#C084FC" />
        <circle cx="95" cy="140" r="4" fill="#C084FC" />
        <circle cx="110" cy="140" r="4" fill="#C084FC" />
      </svg>
    ),
  },
  {
    id: 'smart-search',
    title: 'Smart Search',
    description:
      'Build-time indexing with Fuse.js for fast, client-side fuzzy search. No Algolia or external service needed.',
    link: '/guides/search/',
    imageGradient: 'from-blue-400 to-cyan-500',
    visualElement: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="35" width="110" height="40" rx="20" fill="white" opacity="0.9" />
        <circle cx="50" cy="55" r="12" stroke="#3B82F6" strokeWidth="4" fill="none" />
        <path d="M60 65 L70 75" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
        <rect x="35" y="90" width="90" height="12" rx="6" fill="white" opacity="0.7" />
        <rect x="35" y="110" width="75" height="12" rx="6" fill="white" opacity="0.5" />
        <rect x="35" y="130" width="80" height="12" rx="6" fill="white" opacity="0.3" />
        <circle cx="120" cy="96" r="6" fill="#22D3EE" />
      </svg>
    ),
  },
  {
    id: 'custom-components',
    title: 'Custom Components',
    description:
      'Drop in your own React components — use them per-page or register globally. Glossary, feedback, and flip cards included.',
    link: '/guides/components/',
    imageGradient: 'from-green-400 to-emerald-500',
    visualElement: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path
            d="M30 40 L70 40 L70 50 Q80 50 80 60 Q80 70 70 70 L70 80 L30 80 L30 60 Q40 60 40 50 Q40 40 30 40 Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M80 40 L120 40 L120 60 Q110 60 110 70 Q110 80 120 80 L120 80 L80 80 Q80 70 80 60 Q80 50 80 40 Z"
            fill="white"
            opacity="0.8"
          />
          <path
            d="M30 80 L70 80 L70 90 Q80 90 80 100 Q80 110 70 110 L70 120 L30 120 L30 80 Z"
            fill="white"
            opacity="0.7"
          />
          <path d="M80 80 L120 80 L120 120 L80 120 L80 110 Q80 100 80 90 Z" fill="white" opacity="0.6" />
        </g>
        <text x="50" y="65" fill="#10B981" fontSize="18" fontWeight="bold" fontFamily="monospace">
          {'</>'}
        </text>
      </svg>
    ),
  },
  {
    id: 'design-tokens',
    title: 'Design Tokens',
    description:
      'JSON-to-CSS pipeline. Define your brand colors and spacing in one file, regenerate all variables automatically.',
    link: '/guides/style-and-layout/',
    imageGradient: 'from-pink-400 to-rose-500',
    visualElement: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="20" fill="#EC4899" opacity="0.9" />
        <circle cx="95" cy="50" r="20" fill="#F472B6" opacity="0.9" />
        <circle cx="50" cy="95" r="20" fill="#FB923C" opacity="0.9" />
        <circle cx="95" cy="95" r="20" fill="#FBBF24" opacity="0.9" />
        <path
          d="M50 70 L50 75 M95 70 L95 75 M70 50 L75 50 M70 95 L75 95"
          stroke="white"
          strokeWidth="3"
          opacity="0.6"
        />
        <rect x="25" y="120" width="110" height="3" rx="1.5" fill="white" opacity="0.7" />
        <rect x="25" y="130" width="90" height="3" rx="1.5" fill="white" opacity="0.5" />
        <rect x="25" y="140" width="70" height="3" rx="1.5" fill="white" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'static-export',
    title: 'Static Export',
    description:
      'Generates a plain HTML/CSS/JS folder. Deploy to Vercel, Netlify, GitHub Pages, S3, or any static host.',
    link: '/guides/deployment/',
    imageGradient: 'from-violet-400 to-purple-500',
    visualElement: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35 50 L65 50 L75 40 L125 40 L125 110 L35 110 Z" fill="white" opacity="0.3" />
        <rect x="45" y="60" width="70" height="8" rx="2" fill="white" opacity="0.8" />
        <rect x="45" y="75" width="65" height="8" rx="2" fill="white" opacity="0.7" />
        <rect x="45" y="90" width="60" height="8" rx="2" fill="white" opacity="0.6" />
        <path
          d="M80 115 L80 135 M70 125 L80 115 L90 125"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <ellipse cx="80" cy="142" rx="25" ry="8" fill="white" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'content-audit',
    title: 'Content Audit Export',
    description:
      'Export your full doc inventory as a CSV — title, URL, doc type, owner, draft status, and last updated. Built for content audits no other docs framework supports.',
    link: '/guides/docs/#sidebar-export',
    imageGradient: 'from-teal-400 to-cyan-500',
    visualElement: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Spreadsheet */}
        <rect x="20" y="20" width="120" height="100" rx="6" fill="white" opacity="0.9" />
        {/* Header row */}
        <rect x="20" y="20" width="120" height="18" rx="6" fill="#0D9488" opacity="0.8" />
        <rect x="20" y="32" width="120" height="6" fill="#0D9488" opacity="0.8" />
        {/* Column dividers */}
        <line x1="65" y1="20" x2="65" y2="120" stroke="#0D9488" strokeWidth="1" opacity="0.3" />
        <line x1="105" y1="20" x2="105" y2="120" stroke="#0D9488" strokeWidth="1" opacity="0.3" />
        {/* Row dividers */}
        <line x1="20" y1="55" x2="140" y2="55" stroke="#0D9488" strokeWidth="1" opacity="0.3" />
        <line x1="20" y1="72" x2="140" y2="72" stroke="#0D9488" strokeWidth="1" opacity="0.3" />
        <line x1="20" y1="89" x2="140" y2="89" stroke="#0D9488" strokeWidth="1" opacity="0.3" />
        <line x1="20" y1="106" x2="140" y2="106" stroke="#0D9488" strokeWidth="1" opacity="0.3" />
        {/* Cell content bars */}
        <rect x="26" y="43" width="32" height="5" rx="2" fill="#0D9488" opacity="0.5" />
        <rect x="71" y="43" width="22" height="5" rx="2" fill="#0D9488" opacity="0.4" />
        <rect x="111" y="43" width="18" height="5" rx="2" fill="#0D9488" opacity="0.4" />
        <rect x="26" y="60" width="28" height="5" rx="2" fill="#0D9488" opacity="0.35" />
        <rect x="71" y="60" width="25" height="5" rx="2" fill="#0D9488" opacity="0.3" />
        <rect x="111" y="60" width="14" height="5" rx="2" fill="#14B8A6" opacity="0.6" />
        <rect x="26" y="77" width="34" height="5" rx="2" fill="#0D9488" opacity="0.35" />
        <rect x="71" y="77" width="20" height="5" rx="2" fill="#0D9488" opacity="0.3" />
        <rect x="111" y="77" width="18" height="5" rx="2" fill="#0D9488" opacity="0.4" />
        <rect x="26" y="94" width="26" height="5" rx="2" fill="#0D9488" opacity="0.35" />
        <rect x="71" y="94" width="28" height="5" rx="2" fill="#0D9488" opacity="0.3" />
        <rect x="111" y="94" width="14" height="5" rx="2" fill="#14B8A6" opacity="0.6" />
        {/* Download arrow */}
        <circle cx="80" cy="143" r="12" fill="white" opacity="0.9" />
        <path d="M80 136 L80 148 M74 143 L80 150 L86 143" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 120 L80 130" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      </svg>
    ),
  },
]

export function FeatureCards() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Link key={feature.id} href={feature.link} className="no-underline text-[var(--foreground)]">
          <motion.div
            onHoverStart={() => setHoveredId(feature.id)}
            onHoverEnd={() => setHoveredId(null)}
            whileHover={{ y: -4 }}
            className="h-full bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
          >
            {/* Gradient Header with SVG */}
            <div
              className={`h-40 bg-gradient-to-br ${feature.imageGradient} flex items-center justify-center relative overflow-hidden`}
            >
              <motion.div
                className="w-40 h-40"
                animate={{
                  scale: hoveredId === feature.id ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {feature.visualElement}
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  )
}
