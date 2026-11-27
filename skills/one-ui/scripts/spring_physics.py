"""Unit-step response from rest for m*x'' + c*x' + k*(x-1) = 0."""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Spring:
    omega: float
    decay: float
    frequency: float
    slow: float

    @classmethod
    def from_tokens(cls, spec: dict) -> Spring:
        for key in ("stiffness", "damping", "mass", "response", "dampingFraction"):
            value = spec[key]
            if type(value) not in (int, float) or not math.isfinite(value) or value <= 0:
                raise ValueError(f"{key} must be positive and finite")
        omega = math.sqrt(spec["stiffness"] / spec["mass"])
        decay = spec["damping"] / (2 * spec["mass"])
        frequency = math.sqrt(abs(omega - decay) * (omega + decay))
        # Rationalized slow root avoids subtracting nearly equal large values.
        slow = omega * (omega / (decay + frequency)) if decay > omega else decay
        if not all(math.isfinite(v) and v > 0 for v in (omega, decay, slow)):
            raise ValueError("spring must settle in finite time")
        if not math.isfinite(12 / slow):
            raise ValueError("spring settling time exceeds the finite range")
        return cls(omega, decay, frequency, slow)

    def position(self, time: float) -> float:
        a, b = self.decay, self.frequency
        if a > self.omega:
            error = math.exp(-self.slow*time) * (1 - self.slow*math.expm1(-2*b*time)/(2*b))
        elif a < self.omega:
            error = math.exp(-a*time) * (math.cos(b*time) + a*math.sin(b*time)/b)
        else:
            error = math.exp(-a*time) * (1 + a*time)
        return 1 - error

    @property
    def duration(self) -> float:
        """Last time the analytical response crosses 0.001 displacement error."""
        tolerance = 0.001
        left = 0.0
        if self.decay < self.omega:
            b, a = self.frequency, self.decay
            # At successive extrema t=n*pi/b the error magnitude is exp(-a*t).
            last_peak = max(0, math.ceil(-math.log(tolerance)*b/(math.pi*a)) - 1)
            left = last_peak * math.pi / b
            right = left + (math.pi/2 + math.atan2(a, b)) / b
        else:
            # (1 + slow*t)*exp(-slow*t) bounds the monotone response.
            right = 12 / self.slow
        for _ in range(64):
            mid = (left + right) / 2
            if abs(1 - self.position(mid)) > tolerance:
                left = mid
            else:
                right = mid
        return right

    def css_curve(self) -> str:
        """Sample the closed form, retaining bends with >0.001 interpolation error."""
        duration = self.duration
        count = max(64, math.ceil(duration * self.omega * 32 / (2 * math.pi)))
        if count > 65536:
            raise ValueError("spring needs more than 65536 CSS stops to resolve")
        samples = [self.position(duration * i/count) for i in range(count + 1)]
        samples[-1] = 1.0
        keep = {0, count}
        spans = [(0, count)]
        while spans:
            start, end = spans.pop()
            if end - start < 2:
                continue
            slope = (samples[end] - samples[start]) / (end - start)
            error, bend = max(
                (abs(samples[i] - (samples[start] + slope*(i-start))), i)
                for i in range(start + 1, end)
            )
            if error > 0.001:
                keep.add(bend)
                spans.extend([(start, bend), (bend, end)])
        stops = []
        for i in sorted(keep):
            value = f"{samples[i]:.6f}".rstrip("0").rstrip(".")
            percent = f"{100*i/count:.5f}".rstrip("0").rstrip(".")
            stops.append(f"{value} {percent}%")
        return "linear(" + ", ".join(stops) + ")"
