import pytest


def add(a: int, b: int) -> int:
    return a + b


def test_add_two_numbers() -> None:
    assert add(2, 3) == 5


@pytest.mark.parametrize(
    "a,b,expected",
    [
        (0, 0, 0),
        (10, -2, 8),
        (-4, -6, -10),
    ],
)
def test_add_parametrized(a: int, b: int, expected: int) -> None:
    assert add(a, b) == expected


def test_truthy_example() -> None:
    user = {"name": "Student", "active": True}
    assert user["active"] is True
