require 'liquid'
puts Liquid::VERSION
t = <<~L
size_unset=[{{ size | default: 'md' }}]
str_false_eq_true=[{% if d == true %}yes{% else %}no{% endif %}]
str_false_truthy=[{% if d %}yes{% else %}no{% endif %}]
empty_str_truthy=[{% if e %}yes{% else %}no{% endif %}]
nil_blank=[{% if n != blank %}set{% else %}blank{% endif %}]
empty_blank=[{% if e != blank %}set{% else %}blank{% endif %}]
zero_blank=[{% if z != blank %}set{% else %}blank{% endif %}]
false_blank=[{% if f != blank %}set{% else %}blank{% endif %}]
{% assign allowed = 'button,submit,reset' | split: ',' %}contains_nil=[{% unless allowed contains n %}fallback{% endunless %}]
contains_ok=[{% if allowed contains 'submit' %}ok{% endif %}]
contains_substr=[{% if allowed contains 'sub' %}BAD{% else %}ok{% endif %}]
escape=[{{ '<a href="x">&' | escape }}]
num_escape=[{{ z | escape }}]
default_false=[{{ f | default: 'dflt' }}]
append_num=[{{ 'p-' | append: 7 }}]
L
puts Liquid::Template.parse(t).render('d' => 'false', 'e' => '', 'z' => 0, 'f' => false)
