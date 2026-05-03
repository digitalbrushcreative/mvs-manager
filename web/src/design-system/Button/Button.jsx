import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

/**
 * Variants: primary, secondary, ghost, danger, light
 * Sizes:    sm, md (default), lg
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', leadingIcon, trailingIcon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(styles.btn, styles[`btn_${variant}`], styles[`btn_${size}`], className)}
      {...rest}
    >
      {leadingIcon ? <span className={styles.icon}>{leadingIcon}</span> : null}
      {children ? <span>{children}</span> : null}
      {trailingIcon ? <span className={styles.icon}>{trailingIcon}</span> : null}
    </button>
  );
});
