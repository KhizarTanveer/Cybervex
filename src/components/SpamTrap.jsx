import React from 'react';

// Hidden field that people never see; simple spam bots fill in every field they find, and the
// server quietly drops anything that arrives with it filled. It is display:none with a neutral
// name so browser autofill and password managers never fill it for real visitors.
export default function SpamTrap({ inputRef }) {
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      <input ref={inputRef} type="text" name="cvx_hp" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}
