# Dear robot PR reviewer in the cloud

Please to be _not_ suggesting anything like the following:

**GitHub Copilot:**

> [nitpick] Missing space after if keyword. Should be `if (!this.#errorStack && error.stack)`
to follow standard JavaScript formatting conventions.

GitHub, Prettier is the devil (no offense to Prettier) and its rigid,
uglification code style rules can eat a bag of uhhh ... fries. 👀

I code with intent and spacing is _specific_ to my style, as is how things are
laid out, and paragraphed, stanza'ed, etc. Best to be just sticking to code
reviews that affect, well, the application.

I have very specific rules for linting found in eslint.config.js, which suits
me and my style just fine without some freakish, space-fetishist Prettier
dominating and actually ruining my carefully designed and structured code.

Worst thing ever. Opinionated formatter; I'll show you an opinionated
formatter.

**Claude code:**

Potential Issues & Improvements

> Code Style Consistency
> Missing space after if (line 74): `if(!this.#errorStack` should be `if (!this.#errorStack` to match project style

Claude, when you say something like "to match the project style," it reduces my
confidence in your ability to review when the linting rules are clearly
articulated in the file eslint.config.js. As you can see, this file is
_comprehensive_. It is purposeful and aligns with my coding style. Please.

## In conclusion

If you scour a PR and find nothing to bemoan, it's _all right to say that
you didn't find anything to pick at *tech-wise*_.

This isn't an annual budget where if you don't find _something_ to spend your
money/criticism on, then you lose it next time. It's okay to not see any
faults. It's also okay for me to open up a review and see "Oh wow, I got it
right this time!"

Well, this time wasn't this time. 😭

## Post Scrotum

Maybe next time.

## Post Post Scrotum

I just added Prettier to try to see how it might improve my formatting. I was
correct. It did not.

- ASI Erasure
- Code bloat from unnecessary spacing
- Turned a lovely, flourishing `c =>` into `(c) =>` which is basically the
  male glyph and now I can't help but think that maybe Prettier is a little
  sexist. It's _2025, Prettier!_ Time to acknowledge that maybe, MAYBE, that
  parameter just wants to exist in its own best universe without you stomping
  all over its private parts and assigning it something that doesn't belong
  and maybe wasn't welcome. So, no. ~~Prettier~~ Boomer has been relegated to
  the uninstalled bin for hypersexualising my parameters. _coos_ It's ok `c`,
  you're safe now with my permissive `"@stylistic/arrow-parens": ["error", "as-needed"]`.
