import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiSliders, FiUser } from "react-icons/fi";
import { api } from "../context/api";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const textareaClass =
  "mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const inputTypeFor = (type) =>
  ({
    date: "date",
    datetime: "datetime-local",
    decimal: "number",
    email: "email",
    integer: "number",
    phone: "tel",
    url: "url",
  })[type] || "text";

const normalizeDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const CustomFieldsForm = ({
  disabled = false,
  embedded = false,
  fields = [],
  includeSystem = false,
  members,
  onChange,
  title = "Additional information",
  values = {},
}) => {
  const visibleFields = useMemo(
    () =>
      fields
        .filter(
          (field) =>
            !field.archived &&
            field.isVisible &&
            (includeSystem || !field.isSystem),
        )
        .sort((first, second) => first.sortOrder - second.sortOrder),
    [fields, includeSystem],
  );
  const needsMembers = visibleFields.some((field) => field.type === "user");
  const [loadedMembers, setLoadedMembers] = useState([]);

  useEffect(() => {
    if (!needsMembers || members) return;
    let active = true;
    api
      .getEmployees()
      .then(({ employees }) => {
        if (active) setLoadedMembers(employees);
      })
      .catch(() => {
        if (active) setLoadedMembers([]);
      });
    return () => {
      active = false;
    };
  }, [members, needsMembers]);

  if (!visibleFields.length) return null;
  const memberOptions = members || loadedMembers;
  const setValue = (field, value) => onChange({ ...values, [field.key]: value });

  return (
    <section className={embedded ? "border-t border-slate-200 pt-5 md:col-span-2 xl:col-span-4" : "rounded-lg border border-slate-200 bg-white shadow-sm"}>
      <div className={embedded ? "mb-4" : "border-b border-slate-200 px-5 py-4"}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
            <FiSliders className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500">Workspace-specific record details.</p>
          </div>
        </div>
      </div>
      <div className={`grid gap-5 md:grid-cols-2 ${embedded ? "" : "p-5"}`}>
        {visibleFields.map((field) => {
          const value = values[field.key] ?? field.defaultValue ?? "";
          const wide = ["long_text", "multi_select"].includes(field.type);
          const label = (
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              {field.type === "user" && <FiUser className="h-4 w-4 text-slate-400" />}
              {field.label}
              {field.isRequired && <span className="text-rose-500">*</span>}
            </span>
          );

          return (
            <label className={`block ${wide ? "md:col-span-2" : ""}`} key={field.id}>
              {label}
              {field.type === "long_text" ? (
                <textarea
                  className={textareaClass}
                  disabled={disabled}
                  maxLength={field.validation?.maxLength}
                  minLength={field.validation?.minLength}
                  onChange={(event) => setValue(field, event.target.value)}
                  placeholder={field.placeholder}
                  required={field.isRequired}
                  value={value}
                />
              ) : field.type === "boolean" ? (
                <span className="mt-2 flex h-11 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5">
                  <span className="text-sm font-semibold text-slate-600">{value ? "Yes" : "No"}</span>
                  <input
                    checked={Boolean(value)}
                    className="h-4 w-4 accent-violet-600"
                    disabled={disabled}
                    onChange={(event) => setValue(field, event.target.checked)}
                    type="checkbox"
                  />
                </span>
              ) : field.type === "select" ? (
                <select
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) => setValue(field, event.target.value)}
                  required={field.isRequired}
                  value={value}
                >
                  <option value="">Select an option</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "multi_select" ? (
                <span className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                  {field.options.map((option) => {
                    const selected = Array.isArray(value) && value.includes(option.value);
                    return (
                      <button
                        className={`flex h-10 items-center justify-between rounded-md border px-3 text-left text-sm font-semibold transition ${
                          selected
                            ? "border-violet-300 bg-violet-50 text-violet-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                        }`}
                        disabled={disabled}
                        key={option.value}
                        onClick={() =>
                          setValue(
                            field,
                            selected
                              ? value.filter((item) => item !== option.value)
                              : [...(Array.isArray(value) ? value : []), option.value],
                          )
                        }
                        type="button"
                      >
                        {option.label}
                        {selected && <FiCheck className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </span>
              ) : field.type === "user" ? (
                <select
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) => setValue(field, event.target.value)}
                  required={field.isRequired}
                  value={value}
                >
                  <option value="">Select team member</option>
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  disabled={disabled}
                  max={field.validation?.max}
                  maxLength={field.validation?.maxLength}
                  min={field.validation?.min}
                  minLength={field.validation?.minLength}
                  onChange={(event) => setValue(field, event.target.value)}
                  placeholder={field.placeholder}
                  required={field.isRequired}
                  step={field.type === "integer" ? "1" : field.type === "decimal" ? "any" : undefined}
                  type={inputTypeFor(field.type)}
                  value={field.type === "datetime" ? normalizeDateTime(value) : value}
                />
              )}
              {field.description && (
                <span className="mt-1.5 block text-xs leading-5 text-slate-400">{field.description}</span>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
};

export default CustomFieldsForm;
