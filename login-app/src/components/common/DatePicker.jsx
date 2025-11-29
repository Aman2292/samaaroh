import React from 'react';
import DatePicker from 'react-datepicker';
import { Controller } from 'react-hook-form';
import { Calendar } from 'iconsax-react';
import "react-datepicker/dist/react-datepicker.css";

// Custom styles to override default react-datepicker styles
const customStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    width: 100%;
  }
  .react-datepicker {
    font-family: inherit;
    border-color: #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  .react-datepicker__header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    border-top-left-radius: 0.75rem;
    border-top-right-radius: 0.75rem;
    padding-top: 1rem;
  }
  .react-datepicker__current-month {
    color: #1e293b;
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }
  .react-datepicker__day-name {
    color: #64748b;
    font-weight: 500;
  }
  .react-datepicker__day {
    color: #334155;
    border-radius: 0.375rem;
  }
  .react-datepicker__day:hover {
    background-color: #f1f5f9;
  }
  .react-datepicker__day--selected, 
  .react-datepicker__day--keyboard-selected {
    background-color: #4f46e5 !important;
    color: white !important;
  }
  .react-datepicker__day--today {
    font-weight: bold;
    color: #4f46e5;
  }
  .react-datepicker__triangle {
    display: none;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #64748b;
    border-width: 2px 2px 0 0;
  }
`;

const CustomDatePicker = ({
  label,
  name,
  control,
  error,
  placeholder = "Select date",
  className = "",
  required = false,
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat = "dd/MM/yyyy",
  value,
  onChange,
  onBlur,
  ...props
}) => {
  const renderDatePicker = (fieldValue, fieldOnChange, fieldOnBlur) => (
    <DatePicker
      selected={fieldValue ? new Date(fieldValue) : null}
      onChange={(date) => fieldOnChange(date)}
      onBlur={fieldOnBlur}
      placeholderText={placeholder}
      className={`
                w-full bg-white border rounded-lg pl-10 pr-3 py-2.5 text-slate-800
                focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                transition-all duration-200
                ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'}
            `}
      dateFormat={dateFormat}
      minDate={minDate}
      maxDate={maxDate}
      showTimeSelect={showTimeSelect}
      onKeyDown={(e) => e.preventDefault()}
      {...props}
    />
  );

  return (
    <div className={`w-full ${className}`}>
      <style>{customStyles}</style>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          <Calendar size="20" />
        </div>
        {control ? (
          <Controller
            control={control}
            name={name}
            render={({ field: { onChange: fieldOnChange, onBlur: fieldOnBlur, value: fieldValue } }) =>
              renderDatePicker(fieldValue, fieldOnChange, fieldOnBlur)
            }
          />
        ) : (
          renderDatePicker(value, onChange, onBlur)
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message || error}</p>
      )}
    </div>
  );
};

export default CustomDatePicker;
