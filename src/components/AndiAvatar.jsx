import React from 'react';
import andi from '../assets/sinova/andi.svg';

/**
 * Karakter Andi sebagai ilustrasi untuk overlay onboarding (welcome/tutorial).
 * Aset: src/assets/sinova/andi.svg
 */
export default function AndiAvatar({ size = 150, className = '' }) {
  return (
    <img
      src={andi}
      alt="Andi, pemandu SINOVA"
      className={`sinova-andi ${className}`.trim()}
      style={{ width: size, height: 'auto' }}
      draggable={false}
    />
  );
}
