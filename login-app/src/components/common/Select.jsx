import React from 'react';
import ReactSelect, { components } from 'react-select';
import { ArrowDown2 } from 'iconsax-react';
import { Controller } from 'react-hook-form';

// Custom option component to display icon + label  
const CustomOption = (props) => {
    const { data } = props;
    const IconComponent = data.icon;

    return (
        <components.Option {...props}>
            <div className="flex items-center gap-2">
                {IconComponent && React.createElement(IconComponent, { size: 18, color: data.textColor, variant: "Bulk" })}
                <span>{data.label}</span>
            </div>
        </components.Option>
    );
};

// Custom single value component (what shows when selected)
const CustomSingleValue = (props) => {
    const { data } = props;
    const IconComponent = data.icon;

    return (
        <components.SingleValue {...props}>
            <div className="flex items-center gap-2">
                {IconComponent && React.createElement(IconComponent, { size: 18, color: data.textColor, variant: "Bulk" })}
                <span>{data.label}</span>
            </div>
        </components.SingleValue>
    );
};

const CustomDropdownIndicator = (props) => {
    return (
        <components.DropdownIndicator {...props}>
            <ArrowDown2 size="16" className="text-slate-400" />
        </components.DropdownIndicator>
    );
};

const Select = ({
    label,
    name,
    options = [],
    register,
    control,
    error,
    placeholder = "Select an option",
    className = "",
    required = false,
    disabled = false,
    onChange,
    value,
    isSearchable = false,
    ...props
}) => {
    // Custom styles for React-Select
    const customStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: disabled ? '#F8FAFC' : 'white',
            borderColor: error
                ? '#FCA5A5'
                : state.isFocused
                    ? '#8B5CF6'
                    : '#E2E8F0',
            borderRadius: '0.5rem',
            padding: '0.125rem 0.25rem',
            minHeight: '42px',
            boxShadow: state.isFocused
                ? '0 0 0 3px rgba(139, 92, 246, 0.1)'
                : 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
                borderColor: error ? '#FCA5A5' : state.isFocused ? '#8B5CF6' : '#CBD5E1'
            }
        }),
        option: (base, state) => {
            const option = state.data;
            const bgColor = option.bgColor || (state.isSelected
                ? '#EDE9FE'
                : state.isFocused
                    ? '#F8FAFC'
                    : 'white');
            const textColor = option.textColor || (state.isSelected ? '#5B21B6' : '#1E293B');

            return {
                ...base,
                backgroundColor: bgColor,
                color: textColor,
                cursor: 'pointer',
                padding: '10px 12px',
                transition: 'all 0.15s',
                '&:active': {
                    backgroundColor: option.bgColor || '#EDE9FE'
                }
            };
        },
        menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            marginTop: '4px',
            overflow: 'hidden'
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999
        }),
        menuList: (base) => ({
            ...base,
            padding: '4px',
            maxHeight: '280px'
        }),
        placeholder: (base) => ({
            ...base,
            color: '#94A3B8',
            fontSize: '0.875rem'
        }),
        singleValue: (base) => ({
            ...base,
            color: '#1E293B',
            fontSize: '0.875rem'
        }),
        input: (base) => ({
            ...base,
            color: '#1E293B',
            fontSize: '0.875rem'
        }),
        dropdownIndicator: (base, state) => ({
            ...base,
            padding: '8px',
            transition: 'transform 0.2s',
            transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }),
        indicatorSeparator: () => ({
            display: 'none'
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: '8px',
            cursor: 'pointer',
            color: '#94A3B8',
            '&:hover': {
                color: '#64748B'
            }
        })
    };

    // If using react-hook-form with Controller
    if (control && name) {
        return (
            <div className={`w-full ${className}`}>
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <Controller
                    name={name}
                    control={control}
                    rules={{ required: required ? `${label || 'This field'} is required` : false }}
                    render={({ field }) => (
                        <ReactSelect
                            {...field}
                            options={options}
                            styles={customStyles}
                            placeholder={placeholder}
                            isDisabled={disabled}
                            isClearable={false}
                            isSearchable={isSearchable}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            components={{
                                DropdownIndicator: CustomDropdownIndicator,
                                Option: CustomOption,
                                SingleValue: CustomSingleValue
                            }}
                            value={options.find(opt => opt.value === field.value) || null}
                            onChange={(selectedOption) => {
                                field.onChange(selectedOption?.value || '');
                                onChange?.(selectedOption?.value || '');
                            }}
                            {...props}
                        />
                    )}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error.message || error}</p>
                )}
            </div>
        );
    }

    // For controlled component usage (non-react-hook-form)
    const selectedOption = options.find(opt => opt.value === value) || null;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <ReactSelect
                options={options}
                styles={customStyles}
                placeholder={placeholder}
                isDisabled={disabled}
                isClearable={false}
                isSearchable={isSearchable}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                components={{
                    DropdownIndicator: CustomDropdownIndicator,
                    Option: CustomOption,
                    SingleValue: CustomSingleValue
                }}
                value={selectedOption}
                onChange={(selectedOption) => {
                    const newValue = selectedOption?.value || '';
                    // Mimic native event structure for compatibility
                    const syntheticEvent = {
                        target: {
                            name: name,
                            value: newValue
                        }
                    };
                    onChange?.(syntheticEvent);
                }}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error.message || error}</p>
            )}
        </div>
    );
};

export default Select;
