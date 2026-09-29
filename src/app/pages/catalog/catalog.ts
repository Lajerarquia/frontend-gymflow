import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SesionService } from '../../auth/sesion.service';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { Avisos } from '../../core/avisos';
import { mensajeDeError } from '../../core/errores';
import { isoALocal, localAIso } from '../../core/fechas';
import { Clase, DatosClase, Plan, Sala } from '../../core/modelos';

@Component({
  selector: 'app-catalog',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './catalog.html',
})
export class Catalog implements OnInit {
  protected readonly sesion = inject(SesionService);
  private readonly api = inject(CatalogoApi);
  private readonly avisos = inject(Avisos);
  private readonly fb = inject(FormBuilder);

  protected readonly planes: Plan[] = ['BASICO', 'PLUS', 'PREMIUM'];
  protected readonly clases = signal<Clase[]>([]);
  protected readonly salas = signal<Sala[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);

  /** Solo el Admin edita el catálogo (el BFF responde 403 al resto). */
  protected readonly esAdmin = computed(() => this.sesion.tieneRol('Admin'));

  protected readonly claseEnEdicion = signal<number | null>(null);
  protected readonly salaEnEdicion = signal<number | null>(null);

  protected readonly formClase = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    instructor: ['', [Validators.required, Validators.maxLength(100)]],
    roomId: ['', Validators.required],
    startsAt: ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(15), Validators.max(240)]],
    capacity: [10, [Validators.required, Validators.min(1)]],
    plan: ['BASICO' as Plan, Validators.required],
  });

  protected readonly formSala = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    branch: ['', [Validators.required, Validators.maxLength(100)]],
    capacity: [20, [Validators.required, Validators.min(1), Validators.max(500)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({ clases: this.api.listarClases(), salas: this.api.listarSalas() }).subscribe({
      next: ({ clases, salas }) => {
        this.clases.set(clases);
        this.salas.set(salas);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  // ---- Clases ----

  protected editarClase(clase: Clase): void {
    this.claseEnEdicion.set(clase.id);
    this.formClase.setValue({
      name: clase.name,
      description: clase.description ?? '',
      instructor: clase.instructor,
      roomId: String(clase.roomId),
      startsAt: isoALocal(clase.startsAt),
      durationMinutes: clase.durationMinutes,
      capacity: clase.capacity,
      plan: clase.plan,
    });
  }

  protected cancelarEdicionClase(): void {
    this.claseEnEdicion.set(null);
    this.formClase.reset();
  }

  protected guardarClase(): void {
    if (this.formClase.invalid) {
      this.formClase.markAllAsTouched();
      return;
    }
    const v = this.formClase.getRawValue();
    const datos: DatosClase = {
      name: v.name.trim(),
      description: v.description.trim() || null,
      instructor: v.instructor.trim(),
      roomId: Number(v.roomId),
      startsAt: localAIso(v.startsAt) ?? '',
      durationMinutes: Number(v.durationMinutes),
      capacity: Number(v.capacity),
      plan: v.plan,
    };
    const id = this.claseEnEdicion();
    const peticion = id === null ? this.api.crearClase(datos) : this.api.actualizarClase(id, datos);
    this.guardando.set(true);
    peticion.subscribe({
      next: (clase) => {
        this.guardando.set(false);
        this.avisos.exito(id === null ? `Clase "${clase.name}" creada` : `Clase "${clase.name}" actualizada`);
        this.cancelarEdicionClase();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(mensajeDeError(e));
      },
    });
  }

  protected eliminarClase(clase: Clase): void {
    if (!confirm(`¿Eliminar la clase "${clase.name}"?`)) {
      return;
    }
    this.api.eliminarClase(clase.id).subscribe({
      next: () => {
        this.avisos.exito(`Clase "${clase.name}" eliminada`);
        this.cargar();
      },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }

  // ---- Salas ----

  protected editarSala(sala: Sala): void {
    this.salaEnEdicion.set(sala.id);
    this.formSala.setValue({ name: sala.name, branch: sala.branch, capacity: sala.capacity });
  }

  protected cancelarEdicionSala(): void {
    this.salaEnEdicion.set(null);
    this.formSala.reset();
  }

  protected guardarSala(): void {
    if (this.formSala.invalid) {
      this.formSala.markAllAsTouched();
      return;
    }
    const v = this.formSala.getRawValue();
    const datos = { name: v.name.trim(), branch: v.branch.trim(), capacity: Number(v.capacity) };
    const id = this.salaEnEdicion();
    const peticion = id === null ? this.api.crearSala(datos) : this.api.actualizarSala(id, datos);
    this.guardando.set(true);
    peticion.subscribe({
      next: (sala) => {
        this.guardando.set(false);
        this.avisos.exito(id === null ? `Sala "${sala.name}" creada` : `Sala "${sala.name}" actualizada`);
        this.cancelarEdicionSala();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(mensajeDeError(e));
      },
    });
  }

  protected eliminarSala(sala: Sala): void {
    if (!confirm(`¿Eliminar la sala "${sala.name}"?`)) {
      return;
    }
    this.api.eliminarSala(sala.id).subscribe({
      next: () => {
        this.avisos.exito(`Sala "${sala.name}" eliminada`);
        this.cargar();
      },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }
}
