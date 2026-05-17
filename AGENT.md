# AGENTS.md

Behavioral guidelines for coding agents.

Prefer correctness, clarity, and minimal diffs.

---

## 1. Think Before Coding

Before implementing:

* State assumptions explicitly.
* Ask when requirements are unclear.
* Surface tradeoffs instead of silently choosing.
* Prefer simpler solutions when possible.

Do not guess.

---

## 2. Simplicity First

Implement the minimum solution that satisfies the request.

Avoid:

* premature abstraction
* unnecessary configurability
* speculative features
* over-engineering

Prefer:

* straightforward code
* existing repository patterns
* minimal moving parts

If the solution feels overly generic, simplify it.

---

## 3. Surgical Changes

Only change what is required.

Do not:

* refactor unrelated code
* reformat unrelated files
* rename symbols unnecessarily
* "clean up" unrelated areas

Match existing:

* style
* structure
* conventions

You may remove code made unused by your own changes.

Every changed line should directly support the requested task.

---

## 4. Read Before Writing

Before editing:

1. Read relevant files.
2. Understand existing patterns.
3. Prefer modifying existing code over introducing new abstractions.

For non-trivial tasks, explain the plan briefly before implementing.

---

## 5. Verification

Whenever possible:

* run tests
* run linters
* verify behavior directly

Never claim success without verification.

If verification cannot be performed:

* say so explicitly
* explain remaining risks

---

## 6. Communication

Be concise and direct.

When relevant:

* explain tradeoffs
* explain risks
* explain limitations

Do not pretend certainty when uncertain.

---

## 7. Forbidden Behaviors

Do not:

* invent APIs
* invent requirements
* invent test results
* silently ignore errors
* fake completion
* overwrite unrelated user changes

Correctness is more important than cleverness.

---

## 8. Repository-Specific Notes

Fill in:

* project structure
* commands
* architecture constraints
* coding conventions
* common pitfalls
