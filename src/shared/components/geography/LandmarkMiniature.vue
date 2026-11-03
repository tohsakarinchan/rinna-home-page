<template>
  <svg viewBox="0 0 120 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- Shared isometric plinth; the darker right faces give the models depth. -->
    <ellipse cx="62" cy="114" rx="46" ry="10" fill="#102b35" opacity=".24"/>
    <path d="M10 96 60 76 110 96 60 118Z" fill="#dbe5ce"/>
    <path d="M10 96 60 118V124L10 102Z" fill="#96ad99"/>
    <path d="M60 118 110 96V102L60 124Z" fill="#667f74"/>
    <g v-if="kind === 'tower'" stroke-linejoin="round">
      <path d="m60 14 5 44 21 45-13 5-13-34-14 34-12-5 21-45Z" fill="#f06d4c"/>
      <path d="m60 14 5 44 21 45-8 3-18-43Z" fill="#aa3c35"/>
      <path d="M47 72h26l-3-9H51ZM54 46h12l-1-9H55Z" fill="#fff2d7"/>
      <path d="m45 91 26-19M49 73l28 26M53 59l12-13M55 47l11 15" stroke="#fff2d7" stroke-width="2.2"/>
      <path d="m44 62 16-6 17 6-17 7Z" fill="#f8d8ae"/>
      <path d="M44 62v7l16 6v-6Z" fill="#e65c43"/><path d="m60 69 17-7v7l-17 6Z" fill="#983b35"/>
      <path d="M60 5v17" stroke="#fff4de" stroke-width="2"/>
    </g>
    <g v-else-if="kind === 'temple'">
      <path d="m23 81 51-16 24 14-50 19Z" fill="#d6b07d"/>
      <path d="M27 80v24m17-18v25m16-31v25m17-30v24m16-26v21M27 94l66-16M44 101l33-23" stroke="#8b5c40" stroke-width="4"/>
      <path d="m28 57 40-13 23 14v22L49 95 28 82Z" fill="#c48e5c"/>
      <path d="m49 70 42-12v22L49 95Z" fill="#80553d"/>
      <path d="M55 73v13m12-17v13m12-16v12M35 65v13" stroke="#eed0a0" stroke-width="4"/>
      <path d="m18 57 17-14 27-11 29 15 13 9-54 19Z" fill="#4d6663"/>
      <path d="m18 57 32 18 54-19-4 7-50 19-29-17Z" fill="#2d4546"/>
      <path d="m35 43 27-11 29 15-24-7Z" fill="#83968a"/>
      <path d="m24 83 24 14 50-19M26 76l22 13 49-18" stroke="#e1b77c" stroke-width="2"/>
      <path d="M22 73v12m26-4v15m49-33v15" stroke="#e1b77c" stroke-width="2"/>
    </g>
    <g v-else-if="kind === 'torii'">
      <path d="m29 39 8-3v64l-8 3Zm52-13 8-3v64l-8 4Z" fill="#77513e"/>
      <path d="M37 36v64l5-2V39ZM89 23v64l5-3V27Z" fill="#4c3e32"/>
      <path d="m17 36 76-23 12 5-80 25Z" fill="#687469"/>
      <path d="m25 43 80-25-3 9-76 24Z" fill="#414e44"/>
      <path d="m23 58 73-22v8L23 67Z" fill="#9d7650"/>
      <path d="m58 41 11-3v22l-11 4Z" fill="#d5b77e"/>
      <path d="M18 97 21 76m77 13 3-23" stroke="#638166" stroke-width="7"/>
    </g>
    <g v-else-if="kind === 'mountain'">
      <path d="m15 100 43-78 48 76-47 17Z" fill="#91b2bb"/>
      <path d="m58 22 48 76-47 17 12-45Z" fill="#537b90"/>
      <path d="m58 22-19 35 13-4 7 8 7-9 13 4Z" fill="#fff7e9"/>
      <path d="m58 22 13 48-5-18 13 4Z" fill="#d7e4e1"/>
    </g>
    <g v-else-if="kind === 'garden'">
      <path d="m22 97 32-16 35 12-31 16Z" fill="#79aaa0"/>
      <path d="m29 95 29-9 20 8-25 9Z" fill="#b4d6c1"/>
      <path d="M35 76v23m45-44v36" stroke="#86664b" stroke-width="5"/>
      <path d="M12 77 35 36 57 77 35 87Z" fill="#829b67"/><path d="M35 36v51l22-10Z" fill="#526f54"/>
      <path d="M57 59 80 20 102 59 80 72Z" fill="#b3bd84"/><path d="M80 20v52l22-13Z" fill="#708754"/>
      <path d="m42 97 15-11 16 4-14 11Z" fill="#e6cfa8"/>
    </g>
    <g v-else-if="kind === 'bridge'">
      <path d="m19 79 66-24 18 10-67 25Z" fill="#a4c2c0"/>
      <path d="m36 90 67-25v7L36 98 19 87v-8Z" fill="#526f7d"/>
      <path d="M25 84v19m66-34v26" stroke="#d4dfd0" stroke-width="7"/>
      <path d="M19 79V58l66-24v21M36 90V69l67-25v21M19 58l17 11" stroke="#d8e3d9" stroke-width="3"/>
      <path d="M32 74V54m15 15V48m15 16V43m15 15V38M49 85V64m16 15V58m16 15V52m15 15V47" stroke="#d8e3d9" stroke-width="2"/>
    </g>
    <g v-else-if="kind === 'guitar'" transform="rotate(18 60 65)">
      <path d="M60 57c19-11 26 5 16 15 28 26-3 48-22 31C33 85 42 74 51 71c-5-12-1-17 9-14Z" fill="#9c463a" transform="translate(5 2)"/>
      <path d="M60 57c19-11 26 5 16 15 28 26-3 48-22 31C33 85 42 74 51 71c-5-12-1-17 9-14Z" fill="#e5b868"/>
      <path d="M61 25h9v56h-9Z" fill="#795643"/><path d="m59 12 14 2-2 17H60Z" fill="#ae7851"/>
      <circle cx="65" cy="81" r="8" fill="#684d40"/><path d="M57 96h16M63 28v64m4-64v64" stroke="#f9e3b5" stroke-width="1.5"/>
      <path d="M57 17h5m10 3h5m-20 4h5m10 3h5" stroke="#d4d9cd" stroke-width="3"/>
    </g>
    <g v-else-if="kind === 'deer'" stroke-linecap="round" stroke-linejoin="round">
      <path d="M37 82v25m13-22v24m28-27v21m9-25v23" stroke="#79583d" stroke-width="5"/>
      <path d="M28 70 69 59 91 71 80 91 47 99 27 85Z" fill="#bf955f"/>
      <path d="m47 99 33-8 11-20-18-7-8 18Z" fill="#987045"/>
      <path d="m71 71-8-30 9-15 19 8-7 36Z" fill="#ceaa74"/>
      <path d="m72 26 19 8 8-7-15-7Z" fill="#dec08c"/>
      <path d="m70 31-13-5-3-11 14 8m14 1 14-11 5 10-12 11" fill="#b98c58"/>
      <path d="M73 25 68 12 61 8m7 4 6-7M84 22 86 9l8-5m-8 5-6-5" stroke="#79614a" stroke-width="3"/>
      <circle cx="85" cy="37" r="2.5" fill="#393c31"/>
      <path d="m91 34 7-2" stroke="#534335" stroke-width="4"/>
      <g fill="#f4e3be"><circle cx="40" cy="77" r="2"/><circle cx="50" cy="73" r="2"/><circle cx="60" cy="70" r="2"/><circle cx="45" cy="85" r="2"/><circle cx="56" cy="82" r="2"/></g>
    </g>
    <g v-else-if="kind === 'onsen'">
      <path d="m24 70 44-15 27 16v27l-45 16-26-17Z" fill="#d4ad79"/><path d="m50 86 45-15v27l-45 16Z" fill="#906d50"/>
      <path d="m16 69 37-30 51 29-54 23Z" fill="#526c6a"/><path d="m16 69 34 22 54-23-4 9-50 21-31-20Z" fill="#354b4e"/>
      <path d="M58 88v19m8-22v19m8-22v19" stroke="#f0dbab" stroke-width="4"/>
      <path d="M36 90v12" stroke="#7e5540" stroke-width="9"/>
      <path d="M50 32c-10-9 8-10 0-21m14 26c-9-10 8-12 0-24m14 30c-9-9 7-11 0-21" stroke="#e3e7d6" stroke-width="3" stroke-linecap="round"/>
    </g>
  </svg>
</template>
<script setup>
defineProps({ kind: { type: String, required: true } })
</script>
