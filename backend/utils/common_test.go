package utils

import (
	"reflect"
	"testing"
)

func TestHasKey(t *testing.T) {

	{
		result := HasKey(map[string]any{
			"key": "key",
		}, "key")

		const expected = true
		if result != expected {
			t.Errorf("HasKey 1 => %t; expected %t", result, expected)
		}
	}

	{
		result := HasKey(map[string]any{}, "key")

		const expected = false

		if result != expected {
			t.Errorf("HasKey 1 => %t; expected %t", result, expected)
		}
	}

}

func TestOfType(t *testing.T) {

	{
		result := OfType("string", reflect.TypeOf(""))

		const expected = true
		if result != expected {
			t.Errorf("OfType 1 => %t; expected %t", result, expected)
		}
	}
	{
		result := OfType(1, reflect.TypeOf(""))

		const expected = false
		if result != expected {
			t.Errorf("OfType 2 => %t; expected %t", result, expected)
		}
	}

}

func TestStringOfLength(t *testing.T) {

	{
		result := StringOfLength("string", 3, 10)

		const expected = true
		if result != expected {
			t.Errorf("StringOfLength 1 => %t; expected %t", result, expected)
		}
	}

	{
		result := StringOfLength("string", 20, 30)

		const expected = false
		if result != expected {
			t.Errorf("StringOfLength 2 => %t; expected %t", result, expected)
		}
	}

}
