import React, { useEffect, useState } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { ModelResponse } from '../API/Model';
import './Dropdown.css';

interface Dropdown {
  items: ModelResponse[] | undefined;
  selectedSlug?: string;
  handleSelect: (model: ModelResponse) => void;
}
export default ({ items, handleSelect, selectedSlug }: Dropdown) => {
  const [title, setTitle] = useState(selectedSlug || 'undefined');
  useEffect(() => {
    if (selectedSlug) {
      const f = items && items.find(i => i.slug === selectedSlug);
      if (f) {
        setTitle(f.title);
      }
    }
  }, [selectedSlug, items]);

  return (
    <DropdownButton
      bsSize='small'
      id={'model-dropdown'}
      title={title}>
      {items &&
        handleSelect &&
        items.map((item, i: number) => {
          return (
            <MenuItem
              eventKey={i}
              key={item.title}
              // tslint:disable-next-line jsx-no-lambda
              onSelect={() => {
                setTitle(item.title);
                handleSelect(item);
              }}>
              <strong>{item.title}</strong>
            </MenuItem>
          );
        })}
    </DropdownButton>
  );
};
