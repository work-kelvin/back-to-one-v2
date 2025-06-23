import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = (props) => (
  <input {...props} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
); 