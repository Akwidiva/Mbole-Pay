export function MboleLogo({ className = "h-8 w-8" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Orange hands - top */}
      <g id="orange-hands">
        {/* Left orange hand */}
        <path
          d="M 50 60 Q 45 55 45 50 Q 45 45 50 45 Q 55 45 55 50 Q 55 60 60 70"
          fill="hsl(var(--primary))"
        />
        <path
          d="M 60 50 Q 58 45 62 40 Q 65 38 68 42"
          fill="hsl(var(--primary))"
        />
        <path
          d="M 65 55 Q 65 48 70 45 Q 73 43 75 50"
          fill="hsl(var(--primary))"
        />
        
        {/* Right orange hand */}
        <path
          d="M 150 60 Q 155 55 155 50 Q 155 45 150 45 Q 145 45 145 50 Q 145 60 140 70"
          fill="hsl(var(--primary))"
        />
        <path
          d="M 140 50 Q 142 45 138 40 Q 135 38 132 42"
          fill="hsl(var(--primary))"
        />
        <path
          d="M 135 55 Q 135 48 130 45 Q 127 43 125 50"
          fill="hsl(var(--primary))"
        />
      </g>

      {/* Green hands - bottom */}
      <g id="green-hands">
        {/* Left green hand */}
        <path
          d="M 50 140 Q 45 145 45 150 Q 45 155 50 155 Q 55 155 55 150 Q 55 140 60 130"
          fill="hsl(var(--secondary))"
        />
        <path
          d="M 60 150 Q 58 155 62 160 Q 65 162 68 158"
          fill="hsl(var(--secondary))"
        />
        <path
          d="M 65 145 Q 65 152 70 155 Q 73 157 75 150"
          fill="hsl(var(--secondary))"
        />
        
        {/* Right green hand */}
        <path
          d="M 150 140 Q 155 145 155 150 Q 155 155 150 155 Q 145 155 145 150 Q 145 140 140 130"
          fill="hsl(var(--secondary))"
        />
        <path
          d="M 140 150 Q 142 155 138 160 Q 135 162 132 158"
          fill="hsl(var(--secondary))"
        />
        <path
          d="M 135 145 Q 135 152 130 155 Q 127 157 125 150"
          fill="hsl(var(--secondary))"
        />
      </g>

      {/* Smile curve */}
      <path
        d="M 70 130 Q 100 145 130 130"
        stroke="hsl(var(--secondary))"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MboleLogoWithText({ className = "" }) {
  return (
      <div className={`flex items-center gap-3 ${className}`}>
      <MboleLogo className="h-10 w-10" />
      <div className="flex flex-col">
        <span className="text-lg font-bold">
          <span style={{ color: 'hsl(var(--primary))' }}>Mbole</span>
          <span style={{ color: 'hsl(var(--secondary))' }}> Pay</span>
        </span>
      </div>
    </div>
  )
}
